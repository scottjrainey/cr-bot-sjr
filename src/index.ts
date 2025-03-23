import { Probot, Context } from "probot";

// TODO something seems off about this import
import crRequest from "./cr-request.js";

const MAX_PATCH_LENGTH = Infinity;

interface PullRequestReviewComment {
  path: string;
  body: string;
  line: number;
  start_line?: number;
}

export default (app: Probot) => {
  app.log.info("Probot started...");

  // Bail if there is no OpenAI API key
  // if (!process.env.OPENAI_API_KEY) {
  //   app.log.warn("No OpenAI API key found. Aborting code review");
  //   return;
  // }

  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context: Context<"pull_request">) => {
      const { owner, repo } = context.repo();
      const { pull_request } = context.payload;
      
      if (pull_request.state == "closed" || pull_request.locked) {
        app.log.info("PR is closed or locked");
        return "PR is closed or locked ";
      }

      const data = await context.octokit.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${pull_request.base.sha}...${pull_request.head.sha}`,
      });
      let { files: changedFiles, commits } = data.data;

      if (!changedFiles?.length) {
        app.log.info("No files changed");
        return "No files changed";
      }

      const fileReviewPromises = changedFiles.flatMap(async (file) => {
        const patch = file.patch || "";

        if (file.status !== "modified" && file.status !== "added") {
          return;
        }

        if (!patch || patch.length > MAX_PATCH_LENGTH) {
          app.log.warn(`Skipping ${file.filename} patch too large`);
          return;
        }

        try {
          const reviewComments = await crRequest(patch);
          return reviewComments.map(({ body, start_line, line }) => ({
            path: file.filename,
            body,
            line,
            start_line: line === start_line ? undefined : start_line,
          }));
        } catch (e) {
          app.log.warn(`Failed to create review for ${file.filename}, ${e}}`, e);
          return null;
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
        app.log.warn('Failed to create code review', e);
      }

      return 'success'
    },
  );
};
