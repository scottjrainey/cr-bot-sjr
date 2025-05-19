// Token for testing:
// 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
// Import everything EXCEPT myProbotApp and crRequest, which will be
// imported dynamically after mocking
import { describe, beforeEach, afterEach, test, expect, vi } from "vitest";
import nock from "nock";
import { Probot, ProbotOctokit } from "probot";
import type { ApplicationFunction, Logger } from "probot";
import type { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Requiring our fixtures
import pullRequestOpenedPayload from "./fixtures/pull_request.opened.json" assert { type: "json" };
import responseCompare from "./fixtures/response.compare.json" assert { type: "json" };

// Define the types locally instead of importing them from the module you'll mock
interface MessageContentReview {
  path: string;
  body: string;
  suggestion?: string;
  line: number;
  start_line?: number;
};

interface PromptStrings {
  system: string;
  user: string;
  jsonFormatRequirement: string;
};

interface ContentReviewOptions {
  path: string;
  log: Logger; // Using 'any' for simplicity in tests
  prompts: PromptStrings;
};

type CrRequestModuleDefaultFunction = (
  patch: string,
  options: ContentReviewOptions,
) => Promise<MessageContentReview[]>;

const reviewCreatedBody = {
  body: "Thanks for the PR!",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(path.join(__dirname, "fixtures/mock-cert.pem"), "utf-8");

const mockConfigSettingsBuffer = Buffer.from(
  JSON.stringify({
    prompts: {
      system: "You are a code reviewer.",
      user: "Review the following code diff:",
      jsonFormatRequirement: "Return the review comments in JSON format.",
    },
  }),
);

describe("My Probot app", () => {
  let probot: Probot;
  let myProbotApp: ApplicationFunction;
  let crRequest: CrRequestModuleDefaultFunction;

  beforeEach(async () => {
    vi.doMock("../src/cr-request.js", () => ({
      default: vi.fn().mockImplementation((_patch, { path }) => {
        if (path === "src/app.module.ts") {
          return Promise.resolve([
            {
              path: "src/app.module.ts",
              body: "The new imports for `TopWorkplacesModule` and `TopWorkplacesService` should be checked for proper functionality, as this could introduce new dependencies. Ensure that the new services are correctly implemented and do not conflict with existing services. It's also important to validate that the `TopWorkplacesService` is declared and provided correctly without any initialization issues.",
              suggestion:
                "// Ensure `TopWorkplacesService` is correctly implemented and used.\n// Check for any conflicts with other services.\n// Ensure all services are properly initialized.",
              line: 6,
              start_line: 4,
            },
          ]);
        }
        if (path === "src/modules/top-workplaces/top-workplaces.service.spec.ts") {
          return Promise.resolve([
            {
              path: "src/modules/top-workplaces/top-workplaces.service.spec.ts",
              body: "The test suite is set up correctly; however, consider adding more granular tests to verify specific functionalities of the `TopWorkplacesService`. This will ensure comprehensive coverage and help in identifying potential bugs within the service methods. Additionally, ensure that you handle any asynchronous operations appropriately by using async/await for tests that might involve promises. Without these tests, you may miss edge cases or unexpected behaviors.",
              suggestion:
                "it('should return a list of workplaces', async () => {\n  const result = await service.getWorkplaces();\n  expect(result).toBeInstanceOf(Array);\n});",
              line: 10,
              start_line: 10,
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    }));
    // Now dynamically import modules that use the mock
    const importedProbotApp = await import("../src/index.js");
    myProbotApp = importedProbotApp.default;

    // Also import the mocked module for testing
    const crRequestModule = await import("../src/cr-request.js");
    crRequest = crRequestModule.default;

    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
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

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("Gracefully bails if OPENAI_API_KEY is not set", async () => {
    const logInfoSpy = vi.spyOn(probot.log, "info").mockImplementation(() => {});
    vi.stubEnv("OPENAI_API_KEY", undefined);

    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: pullRequestOpenedPayload as unknown as PullRequestOpenedEvent,
    });

    expect(logInfoSpy).toHaveBeenCalledWith("No OpenAI API key found. Skipping code review");
  });

  test("Gracefully bails if pull request is closed", async () => {
    const logDebugSpy = vi.spyOn(probot.log, "debug").mockImplementation(() => {});

    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: {
        ...pullRequestOpenedPayload,
        pull_request: {
          ...pullRequestOpenedPayload.pull_request,
          state: "closed",
        },
      } as unknown as PullRequestOpenedEvent,
    });

    expect(logDebugSpy).toHaveBeenCalledWith("PR is closed or locked");
  });

  test("Gracefully bails if pull request is locked", async () => {
    const logDebugSpy = vi.spyOn(probot.log, "debug").mockImplementation(() => {});

    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: {
        ...pullRequestOpenedPayload,
        pull_request: {
          ...pullRequestOpenedPayload.pull_request,
          locked: true,
        },
      } as unknown as PullRequestOpenedEvent,
    });

    expect(logDebugSpy).toHaveBeenCalledWith("PR is closed or locked");
  });

  test("Gracefully bails if there are no reviewable files", async () => {
    const logDebugSpy = vi.spyOn(probot.log, "debug").mockImplementation(() => {});
    const createReviewSpy = vi.fn();

    const repo_full_name = pullRequestOpenedPayload.repository.full_name;
    const installation_id = pullRequestOpenedPayload.installation.id;
    const pull_request_number = pullRequestOpenedPayload.pull_request.number;
    const head = pullRequestOpenedPayload.pull_request.head.sha;
    const base = pullRequestOpenedPayload.pull_request.base.sha;
    const mockGithub = nock("https://api.github.com")
      // Handle access tokens
      .post(`/app/installations/${installation_id}/access_tokens`)
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // Get the diff from the pull request, but with no reviewable files
      .get(`/repos/${repo_full_name}/compare/${base}...${head}`)
      .reply(200, {
        ...responseCompare,
        files: responseCompare.files.slice(0, 2),
      })

      // Start a new review with a comment for each file
      .post(`/repos/${repo_full_name}/pulls/${pull_request_number}/reviews`, (body) => {
        createReviewSpy(body);
        expect(body).toMatchObject(reviewCreatedBody);
        expect(body.comments).toBeDefined();
        expect(body.comments.length).toBe(2);
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: pullRequestOpenedPayload as unknown as PullRequestOpenedEvent,
    });

    expect(logDebugSpy).toHaveBeenCalledWith("No reviewable files changed");
    expect(crRequest).toHaveBeenCalledTimes(0);
    expect(createReviewSpy).toHaveBeenCalledTimes(0);
    expect(mockGithub.pendingMocks()).length(1);
  });

  test("Skips files with no patch", async () => {
    const logInfoSpy = vi.spyOn(probot.log, "info").mockImplementation(() => {});
    const createReviewSpy = vi.fn();

    const repo_full_name = pullRequestOpenedPayload.repository.full_name;
    const installation_id = pullRequestOpenedPayload.installation.id;
    const pull_request_number = pullRequestOpenedPayload.pull_request.number;
    const head = pullRequestOpenedPayload.pull_request.head.sha;
    const base = pullRequestOpenedPayload.pull_request.base.sha;
    const mockGithub = nock("https://api.github.com")
      // Handle access tokens
      .post(`/app/installations/${installation_id}/access_tokens`)
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // Mock the config file request
      .get(`/repos/${repo_full_name}/contents/.github%2Fcr-bot-sjr.yml`)
      .reply(200, { content: mockConfigSettingsBuffer })

      // Get the diff from the pull request, but with no reviewable files
      .get(`/repos/${repo_full_name}/compare/${base}...${head}`)
      .reply(200, {
        ...responseCompare,
        files: responseCompare.files.map((file, i) => {
          return i === 2 ? { ...file, patch: "" } : file;
        }),
      });

    // Receive a webhook event
    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: pullRequestOpenedPayload as unknown as PullRequestOpenedEvent,
    });

    expect(logInfoSpy).toHaveBeenCalledWith(expect.stringContaining("no patch found"));
    expect(crRequest).toHaveBeenCalledTimes(4);
    expect(createReviewSpy).toHaveBeenCalledTimes(0);
    expect(mockGithub.pendingMocks()).toStrictEqual([]);
  });

  // TODO Currently there is an issue with the code not assigning the value
  // from the environmental variable to MAX_PATCH_LENGTH
  test.skip("Skips files with patches that are too large", async () => {
    const logInfoSpy = vi.spyOn(probot.log, "info").mockImplementation(() => {});
    vi.stubEnv("MAX_PATCH_LENGTH", "1");
    const createReviewSpy = vi.fn();

    const repo_full_name = pullRequestOpenedPayload.repository.full_name;
    const installation_id = pullRequestOpenedPayload.installation.id;
    const pull_request_number = pullRequestOpenedPayload.pull_request.number;
    const head = pullRequestOpenedPayload.pull_request.head.sha;
    const base = pullRequestOpenedPayload.pull_request.base.sha;
    const mockGithub = nock("https://api.github.com")
      // Handle access tokens
      .post(`/app/installations/${installation_id}/access_tokens`)
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // Mock the config file request
      .get(`/repos/${repo_full_name}/contents/.github%2Fcr-bot-sjr.yml`)
      .reply(200, { content: mockConfigSettingsBuffer })

      // Get the diff from the pull request, but with no reviewable files
      .get(`/repos/${repo_full_name}/compare/${base}...${head}`)
      .reply(200, responseCompare)

      // Start a new review with a comment for each file
      .post(`/repos/${repo_full_name}/pulls/${pull_request_number}/reviews`, (body) => {
        createReviewSpy(body);
        expect(body).toMatchObject(reviewCreatedBody);
        expect(body.comments).toBeDefined();
        expect(body.comments.length).toBe(2);
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: pullRequestOpenedPayload as unknown as PullRequestOpenedEvent,
    });

    expect(logInfoSpy).toHaveBeenCalledWith(expect.stringContaining("patch too large"));
    expect(crRequest).toHaveBeenCalledTimes(5);
    expect(createReviewSpy).toHaveBeenCalledTimes(0);
    expect(mockGithub.pendingMocks()).length(1);
  });

  test("creates a code review when a reviewable pull request is opened", async () => {
    const createReviewSpy = vi.fn();

    const repo_full_name = pullRequestOpenedPayload.repository.full_name;
    const installation_id = pullRequestOpenedPayload.installation.id;
    const pull_request_number = pullRequestOpenedPayload.pull_request.number;
    const head = pullRequestOpenedPayload.pull_request.head.sha;
    const base = pullRequestOpenedPayload.pull_request.base.sha;
    const mockGithub = nock("https://api.github.com")
      // Handle access tokens
      .post(`/app/installations/${installation_id}/access_tokens`)
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // Mock the config file request
      .get(`/repos/${repo_full_name}/contents/.github%2Fcr-bot-sjr.yml`)
      .reply(200, { content: mockConfigSettingsBuffer })

      // Get the diff from the pull request
      .get(`/repos/${repo_full_name}/compare/${base}...${head}`)
      .reply(200, responseCompare)

      // Start a new review with a comment for each file
      .post(`/repos/${repo_full_name}/pulls/${pull_request_number}/reviews`, (body) => {
        createReviewSpy(body);
        expect(body).toMatchObject({
          body: "No review comments to add.",
          event: "COMMENT",
          comments: []
        });
        return true;
      })
      .reply(200);

    // Receive a webhook event
    await probot.receive({
      id: Math.random().toString(),
      name: "pull_request",
      payload: pullRequestOpenedPayload as unknown as PullRequestOpenedEvent,
    });

    expect(crRequest).toHaveBeenCalledTimes(5);
    expect(createReviewSpy).toHaveBeenCalledTimes(1);
    expect(mockGithub.pendingMocks()).toStrictEqual([]);
  });
});
