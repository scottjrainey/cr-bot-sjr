import { Probot, Context, ProbotOctokit } from "probot";
import picomatch from "picomatch";
import { Request, Response } from "express";
import crRequest from "./cr-request.js";

// .gitignore globs to include and ignore files
// TODO: better name for this variable and make configurable
const INCLUDE_FILES = '**/*.js,**/*.ts';

const isMatch = picomatch(INCLUDE_FILES.split(','));

// TODO This is not working as expected
const MAX_PATCH_LENGTH = process.env.MAX_PATCH_LENGTH
  ? (Number(process.env.MAX_PATCH_LENGTH) || Infinity)
  : Infinity;

interface PullRequestReviewComment {
  path: string;
  body: string;
  line: number;
  start_line?: number;
}

type GitHubEvent = "pull_request" | "issues" | "push";

function formatCommentBody(body: string, suggestion: string = ''): string {
  return !!suggestion
    ? `${body}\n\n\`\`\`suggestion\n${suggestion}\n\`\`\`\n`
    : `${body}\n`;
}

const probotApp = (app: Probot) => {
  const { log } = app;
  log.info("Probot started...");

  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context: Context<"pull_request">) => {
      // Bail if there is no OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        log.info("No OpenAI API key found. Skipping code review");
        return;
      }

      const { owner, repo } = context.repo();
      const { pull_request } = context.payload;
      
      if (pull_request.state == "closed" || pull_request.locked) {
        log.debug("PR is closed or locked");
        return;
      }

      const data = await context.octokit.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${pull_request.base.sha}...${pull_request.head.sha}`,
      });
      let { files: changedFiles, commits } = data.data;

      changedFiles = changedFiles?.filter((file) => isMatch(file.filename));

      if (!changedFiles?.length) {
        log.debug("No reviewable files changed");
        return;
      }

      const fileReviewPromises = changedFiles.flatMap(async (file) => {
        const { filename, patch = "", status } = file;

        if (status !== "modified" && status !== "added") {
          return [];
        }

        if (!patch || patch?.length > MAX_PATCH_LENGTH) {
          log.info(!!patch
            ? `Skipping ${filename} patch too large`
            : `Skipping ${filename} no patch found`);
          return [];
        }

        try {
          const path = filename;
          const reviewComments = await crRequest(patch, { log, path });
          return reviewComments.map(({ body, suggestion, start_line, line }) => ({
            path,
            body: formatCommentBody(body, suggestion),
            line,
            start_line: line === start_line ? undefined : start_line,
          }));
        } catch (e) {
          log.warn(`Failed to create review for ${filename}, ${e}}`, e);
          return [];
        }
      });

      const reviewArrays = await Promise.all(fileReviewPromises);
      const results = reviewArrays.flat();
      // Filter out null/undefined results and add valid comments
      const comments = results.filter(Boolean) as PullRequestReviewComment[];

      try {
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
      } catch (e) {
        log.warn("Failed to create code review", e);
      }

      return;
    },
  );
};

export const githubWebhook = async (req: Request, res: Response) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const probot = new Probot({
      appId: process.env.APP_ID || '',
      privateKey: process.env.PRIVATE_KEY || '',
      secret: webhookSecret,
      Octokit: ProbotOctokit,
    });

    probot.load(probotApp);

    const name = req.headers["x-github-event"] as GitHubEvent;
    const id = req.headers["x-github-delivery"] as string;

    if (!name || !id) {
      res.status(400).send('Missing GitHub event headers');
      return;
    }

    await probot.webhooks.receive({
      id,
      name,
      payload: req.body,
    });

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send(`Error processing webhook: ${error}`);
  }
};

export default probotApp;
