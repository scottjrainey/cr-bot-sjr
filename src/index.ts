import { Probot, Context } from "probot";

const MAX_PATCH_LENGTH = Infinity;

interface PullRequestReviewComment {
  path: string;
  position: number;
  body: string;
}

export default (app: Probot) => {
  app.log.info("Probot started...");
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

      const comments: PullRequestReviewComment[] = [];
      changedFiles.forEach((file) => {
        const patch = file.patch || "";

        if (file.status !== "modified" && file.status !== "added") {
          return;
        }

        if (!patch || patch.length > MAX_PATCH_LENGTH) {
          app.log.warn(`Skipping ${file.filename} patch too large`);
          return;
        }

        comments.push({
          path: file.filename,
          body: 'This is a comment in the diff',
          position: patch.split('\n').length - 1,
        });

      });
      
      try {
        await context.octokit.pulls.createReview({
          repo,
          owner,
          pull_number: pull_request.number,
          body: "Thanks for the PR!",
          event: "COMMENT",
          commit_id: commits[-1].sha,
          comments,
        });  
      } catch (e) {
        app.log.warn('Failed to create code review', e);
      }

      return 'success'
    },
  );
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
