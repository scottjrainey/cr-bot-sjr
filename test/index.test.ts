import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src/index.js";
import { Probot, ProbotOctokit } from "probot";
// Requiring our fixtures
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, beforeEach, afterEach, test, expect } from "vitest";

import pullRequestOpenedPayload from './fixtures/pull_request.opened.json' assert { type: 'json' };

const reviewCreatedBody = {
  body: "Thanks for the PR!",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

// const payload = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "fixtures/issues.opened.json"), "utf-8"),
// );

describe("My Probot app", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test("creates a code review when a pull request is opened", async () => {
    const repo_full_name = pullRequestOpenedPayload.repository.full_name;
    const installation_id = pullRequestOpenedPayload.installation.id;
    const pull_request_number = pullRequestOpenedPayload.pull_request.number;
    const head = pullRequestOpenedPayload.pull_request.head.sha;
    const base = pullRequestOpenedPayload.pull_request.base.sha;
    const mock = nock("https://api.github.com")
      // Test that we correctly return a test token
      .post(`/app/installations/${installation_id}/access_tokens`)
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      .get(`/repos/${repo_full_name}/compare/${base}...${head}`)
      .reply(200)

      // Test that a comment is posted starting a new review
      .post(`/repos/${repo_full_name}/pulls/${pull_request_number}/reviews`, (body: any) => {
        expect(body).toMatchObject(reviewCreatedBody);
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({ name: "pull_request", payload: pullRequestOpenedPayload });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
