import type { Probot, Context } from "probot";
import picomatch from "picomatch";
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import crRequest, { type PromptStrings } from "./cr-request.js";

// Format private key by replacing escaped newlines and ensuring proper PEM format
const formatPrivateKey = (key: string | undefined): string | undefined => {
  if (!key) return undefined;
  
  // Replace escaped newlines with actual newlines
  let formattedKey = key.replace(/\\n/g, '\n');
  
  // Ensure key has proper PEM format
  if (!formattedKey.endsWith('\n')) {
    formattedKey += '\n';
  }
  
  return formattedKey;
};

// Format the private key before it's used
process.env.PRIVATE_KEY = formatPrivateKey(process.env.PRIVATE_KEY);

// .gitignore globs to include and ignore files
// TODO: better name for this variable and make configurable
const INCLUDE_FILES = "**/*.js,**/*.ts";

const isMatch = picomatch(INCLUDE_FILES.split(","));

// TODO This is not working as expected
const MAX_PATCH_LENGTH = process.env.MAX_PATCH_LENGTH
  ? Number(process.env.MAX_PATCH_LENGTH) || Number.POSITIVE_INFINITY
  : Number.POSITIVE_INFINITY;

// GitHub API comment interface
interface GitHubComment {
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

function sanitizeComment(comment: GitHubComment): GitHubComment {
  // Ensure line is always > 0
  const line = (!comment.line || comment.line <= 0) ? 1 : comment.line;

  // Only include start_line if it's different from line and > 0
  const sanitized: GitHubComment = {
    path: comment.path,
    body: comment.body,
    line
  };

  if (comment.start_line && comment.start_line > 0 && comment.start_line !== line) {
    sanitized.start_line = comment.start_line;
  }

  return sanitized;
}

function loadDefaultConfig() {
  const configPath = path.join(process.cwd(), '.github', 'cr-bot-sjr.yml');
  const fileContents = fs.readFileSync(configPath, 'utf8');
  return yaml.load(fileContents) as ConfigSettings;
}

const probotApp = (app: Probot) => {
  const { log } = app;
  log.info("Probot started...");
  console.info("Probot started...");
  
  // Debug environment variables and private key format
  const envVarNames = Object.keys(process.env).sort();
  console.info("Available environment variables:", envVarNames);

  // Check private key format without exposing contents
  const privateKey = process.env.PRIVATE_KEY;
  console.info("Private key analysis:", {
    exists: !!privateKey,
    length: privateKey?.length || 0,
    format: {
      startsWithBegin: privateKey?.startsWith('-----BEGIN'),
      endsWithEnd: privateKey?.endsWith('-----\n'),
      newlineCount: privateKey?.split('\n').length || 0,
      containsRSAMarker: privateKey?.includes('RSA PRIVATE KEY'),
      containsEscapedNewlines: privateKey?.includes('\\n'),
      containsLiteralNewlines: privateKey?.includes('\n')
    }
  });

  // Check if other required env vars are present
  console.info("Required env vars status:", {
    hasAppId: !!process.env.APP_ID,
    hasWebhookSecret: !!process.env.WEBHOOK_SECRET,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY
  });

  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context: Context<"pull_request">) => {
      // TODO Remove after debugging
      console.info("Inside app.on()");

      // Bail if there is no OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        log.info("No OpenAI API key found. Skipping code review");
        console.info("No OpenAI API key found. Skipping code review");
        // console.info("env keys:", Object.keys(process.env));
        // console.info("PRIVATE_KEY length:", process.env.PRIVATE_KEY?.length);
        // console.info("APP_ID present:", !!process.env.APP_ID);
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
      console.log('Attempting to load config...');
      const config = (await context.config("cr-bot-sjr.yml", loadDefaultConfig())) as ConfigSettings;
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
            start_line: line === start_line ? null : start_line,
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
      const comments = results.filter(Boolean) as GitHubComment[];
      console.timeEnd("collect-reviews");

      log.info(`Submitting ${comments.length} review comments for PR #${pull_request.number}`);
      console.info(`Submitting ${comments.length} review comments for PR #${pull_request.number}`);
      console.info('Comments structure:', JSON.stringify(comments, null, 2));

      try {
        console.time("create-review");
        // Sanitize comments before sending to GitHub API
        const sanitizedComments = comments.map(sanitizeComment);

        await context.octokit.pulls.createReview({
          repo,
          owner,
          pull_number: pull_request.number,
          body: "Thanks for the PR!",
          event: "COMMENT",
          commit_id: commits[commits.length - 1].sha,
          comments: sanitizedComments,
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

export default probotApp;
