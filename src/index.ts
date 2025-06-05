import type { Probot, Context } from "probot";
import picomatch from "picomatch";
import crRequest from "./cr-request.js";

// New feature: Enhanced error handling
export const handleReviewError = (error: Error, log: { error: (msg: string) => void }) => {
  log.error(`Review error: ${error.message}`);
  return {
    error: true,
    message: error.message
  };
};

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
export interface GitHubComment {
  path: string;
  body: string;
  line: number;
  start_line?: number;
  suggestion?: string;
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

      if (pull_request.state === "closed" || pull_request.locked) {
        log.debug("PR is closed or locked");
        return;
      }

      console.time("compare-commits");
      const data = await context.octokit.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${pull_request.base.sha}...${pull_request.head.sha}`,
      });
      let { files: changedFiles } = data.data;
      console.timeEnd("compare-commits");

      changedFiles = changedFiles?.filter((file) => isMatch(file.filename));

      if (!changedFiles?.length) {
        log.debug("No reviewable files changed");
        return;
      }

      log.info(`Processing ${changedFiles.length} files for PR #${pull_request.number}`);

      const fileReviewPromises = changedFiles.flatMap(async (file) => {
        const { filename, patch = "", status } = file;

        if (status !== "modified" && status !== "added") {
          log.info(`Skipping ${filename} with status ${status} - only reviewing modified or added files`);
          return [];
        }

        if (!patch || patch?.length > MAX_PATCH_LENGTH) {
          log.info(
            patch ? `Skipping ${filename} patch too large` : `Skipping ${filename} no patch found`,
          );
          return [];
        }

        try {
          log.info(`Starting review for ${filename}`);
          console.time(`review-${filename}`);
          const path = filename;
          const reviewResult = await crRequest(patch, { log, path });
          console.timeEnd(`review-${filename}`);

          if (reviewResult.error || !reviewResult.comments) {
            log.warn(`Skipping review for ${filename} due to error or missing comments`);
            return [];
          }

          log.info(`Completed review for ${filename} with ${reviewResult.comments.length} comments`);
          return reviewResult.comments.map(({ body, suggestion, start_line, line }) => ({
            path,
            body: formatCommentBody(body, suggestion),
            line,
            start_line: line === start_line ? null : start_line,
          }));
        } catch (e) {
          log.warn(`Failed to create review for ${filename}, ${e}}`, e);
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
      console.info('Comments structure:', JSON.stringify(comments, null, 2));

      try {
        console.time("create-review");
        // Sanitize comments before sending to GitHub API
        const sanitizedComments = comments.map(sanitizeComment);

        // Filter out any comments that might cause issues
        const validComments = sanitizedComments.filter(comment => {
          if (!comment.path || !comment.body || typeof comment.line !== 'number') {
            log.warn('Skipping invalid comment:', comment);
            return false;
          }
          return true;
        });

        // Create a review even if there are no comments
        await context.octokit.pulls.createReview({
          repo,
          owner,
          pull_number: pull_request.number,
          body: validComments.length > 0 ? "Thanks for the PR!" : "No review comments to add.",
          event: "COMMENT",
          comments: validComments
        });
        console.timeEnd("create-review");
      } catch (e) {
        log.error(`Failed to create review: ${e}`);
      }

      return;
    },
  );
};

export default probotApp;
