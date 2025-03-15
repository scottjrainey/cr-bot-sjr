import { Probot, Context } from "probot";

export default (app: Probot) => {
  app.log.info("Probot started...");
  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context: Context) => {
      const pr = context.pullRequest();
      app.log.debug(`pull_request: ${JSON.stringify(pr, null, 2)}`);

      try {
        await context.octokit.pulls.createReview({
          repo: pr.repo,
          owner: pr.owner,
          pull_number: pr.pull_number,
          body: "Thanks for the PR!",
          event: "COMMENT",
        });
          
      } catch (e) {
        app.log.warn('Failed to create code review', e);
      }
    },
  );
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
