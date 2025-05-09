import { type Probot, type Context, createNodeMiddleware, createProbot, type Logger } from "probot";
import picomatch from "picomatch";
import type { Request, Response } from "express";
import crRequest, { type PromptStrings } from "./cr-request.js";

// .gitignore globs to include and ignore files
// TODO: better name for this variable and make configurable
const INCLUDE_FILES = "**/*.js,**/*.ts";

const isMatch = picomatch(INCLUDE_FILES.split(","));

// TODO This is not working as expected
const MAX_PATCH_LENGTH = process.env.MAX_PATCH_LENGTH
  ? Number(process.env.MAX_PATCH_LENGTH) || Number.POSITIVE_INFINITY
  : Number.POSITIVE_INFINITY;

interface PullRequestReviewComment {
  path: string;
  body: string;
  line: number;
  start_line?: number;
}

interface ConfigSettings {
  prompts: PromptStrings;
}

function formatCommentBody(body: string, suggestion = "") {
  return suggestion ? `${body}\n\n\`\`\`suggestion\n${suggestion}\n\`\`\`\n` : `${body}\n`;
}

const probotApp = (app: Probot) => {
  const { log } = app;
  log.info("Probot started...");
  console.info("Probot started...");

  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context: Context<"pull_request">) => {
      // TODO Remove after debugging
      console.info("Inside app.on()");

      // Bail if there is no OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        log.info("No OpenAI API key found. Skipping code review");
        console.info("No OpenAI API key found. Skipping code review");
        return;
      }

      const { owner, repo } = context.repo();
      const { pull_request } = context.payload;

      if (pull_request.state === "closed" || pull_request.locked) {
        log.debug("PR is closed or locked");
        console.debug("PR is closed or locked");
        return;
      }

      console.time("compare-commits");
      const data = await context.octokit.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${pull_request.base.sha}...${pull_request.head.sha}`,
      });
      let { files: changedFiles, commits } = data.data;
      console.timeEnd("compare-commits");

      changedFiles = changedFiles?.filter((file) => isMatch(file.filename));

      if (!changedFiles?.length) {
        log.debug("No reviewable files changed");
        console.debug("No reviewable files changed");
        return;
      }

      log.info(`Processing ${changedFiles.length} files for PR #${pull_request.number}`);
      console.info(`Processing ${changedFiles.length} files for PR #${pull_request.number}`);

      // Assuming config is not null since that file exists in the repo
      // with default values
      console.time("get-config");
      const config = (await context.config("cr-bot-sjr.yml")) as ConfigSettings;
      const { prompts } = config;
      console.timeEnd("get-config");

      const fileReviewPromises = changedFiles.flatMap(async (file) => {
        const { filename, patch = "", status } = file;

        if (status !== "modified" && status !== "added") {
          return [];
        }

        if (!patch || patch?.length > MAX_PATCH_LENGTH) {
          log.info(
            patch ? `Skipping ${filename} patch too large` : `Skipping ${filename} no patch found`,
          );
          console.info(
            patch ? `Skipping ${filename} patch too large` : `Skipping ${filename} no patch found`,
          );
          return [];
        }

        try {
          log.info(`Starting review for ${filename}`);
          console.info(`Starting review for ${filename}`);
          console.time(`review-${filename}`);
          const path = filename;
          const reviewComments = await crRequest(patch, { log, path, prompts });
          console.timeEnd(`review-${filename}`);

          log.info(`Completed review for ${filename} with ${reviewComments.length} comments`);
          console.info(`Completed review for ${filename} with ${reviewComments.length} comments`);
          return reviewComments.map(({ body, suggestion, start_line, line }) => ({
            path,
            body: formatCommentBody(body, suggestion),
            line,
            start_line: line === start_line ? undefined : start_line,
          }));
        } catch (e) {
          log.warn(`Failed to create review for ${filename}, ${e}}`, e);
          console.warn(`Failed to create review for ${filename}, ${e}}`, e);
          return [];
        }
      });

      console.time("collect-reviews");
      const reviewArrays = await Promise.all(fileReviewPromises);
      const results = reviewArrays.flat();
      // Filter out null/undefined results and add valid comments
      const comments = results.filter(Boolean) as PullRequestReviewComment[];
      console.timeEnd("collect-reviews");

      log.info(`Submitting ${comments.length} review comments for PR #${pull_request.number}`);
      console.info(`Submitting ${comments.length} review comments for PR #${pull_request.number}`);

      try {
        console.time("create-review");
        await context.octokit.pulls.createReview({
          repo,
          owner,
          pull_number: pull_request.number,
          body: "Thanks for the PR!",
          event: "COMMENT",
          // commits[-1] is returning `undefined` here, using commits[commits.length - 1] instead
          commit_id: commits[commits.length - 1].sha,
          comments,
        });
        console.timeEnd("create-review");
        log.info(`Successfully submitted review for PR #${pull_request.number}`);
        console.info(`Successfully submitted review for PR #${pull_request.number}`);
      } catch (e) {
        log.warn("Failed to create code review", e);
        console.warn("Failed to create code review", e);
      }

      return;
    },
  );
};

export const webhookHandler = (req: Request, res: Response) => {
  try {
    // Log the incoming request
    console.log("Received webhook:", req.headers["x-github-event"]);

    // Check for health endpoint
    if (req.path === "/health" || req.url === "/health") {
      res.status(200).send("Health check OK");
      return;
    }

    // Acknowledge non-PR events immediately
    const event = req.headers["x-github-event"] as string;
    if (event !== "pull_request") {
      console.log(`Received ${event} event, acknowledging without processing`);
      res.status(202).send("Event acknowledged");
      return;
    }

    // For PR events, extract action
    if (event === "pull_request") {
      const action = req.body?.action;
      // Only process opened or synchronized PRs
      if (action !== "opened" && action !== "synchronize") {
        console.log(`Received PR ${action} event, acknowledging without processing`);
        res.status(202).send("Event acknowledged");
        return;
      }
      console.log(JSON.stringify(req.body, null, 2));
    }

    // Acknowledge receipt immediately to prevent timeout
    res.status(202).send("Webhook received, processing asynchronously");

    // Create a probot instance using the environment variables
    const logger = {
      trace: console.trace.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      fatal: console.error.bind(console),
      child: () => logger,
    } as unknown as Logger;
    const overrides = {
      log: logger,
    };
    const probot = createProbot({ overrides });

    // Process the webhook asynchronously after responding
    setTimeout(() => {
      try {
        console.time("process-webhook");
        const middleware = createNodeMiddleware(probotApp, { probot });

        // Create mock response object properly with self-reference
        const mockRes = {
          status: () => mockRes,
          send: (_data: unknown) => mockRes,
          end: () => mockRes,
        } as unknown as Response;

        middleware(req, mockRes);
        console.timeEnd("process-webhook");
      } catch (error) {
        console.error(
          "Error processing webhook asynchronously:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }, 0);
    return;
  } catch (error) {
    console.error(
      "Error in webhookHandler:",
      error instanceof Error ? error.message : "Unknown error",
    );
    // Still try to respond even if there's an error
    if (!res.headersSent) {
      res
        .status(500)
        .send(
          `Error processing webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
    return;
  }
};

export default probotApp;

