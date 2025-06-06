# cr-bot-sjr

![cr-bot-sjr](assets/avatar.png)

> A simple **proof-of-concept/experimental base** _AI_ code review bot using GitHub's
> [Probot][probot], [LangChain][langchain], and [Langfuse][langfuse]
> to experiment with _AI/LLM_ use, prompt management and versioning in _CI/CD_ workflows on _serverless infrastructure_

## --- DISCLAIMER: NOT INTENDED FOR PRODUCTION USE ---

This started as personal project to experiment with Cursor as an IDE, code 0 to 1 on a project using AI assistance, to write code that interacts with _LLM APIs_, and look at prompt management using [Langfuse][langfuse]. I chose to use [Probot][probot] (a part of the GitHub Actions universe) simply because I'd been using _AWS_ and _Jenkins_ at work.

This is meant to provide a "workbench" to play with LLMs in workflows. The prompts included in this project are makeshift and meant to generate demo output without much regard for quality of response. That is intentional and allows the prompts to be easily improved when exploring Langfuse. That said, prompts can be changed easily and set on a _per project_ basis to look at integrating in multiple types of codebases.

## TL;DR

Experiment with LLMs in non-production GitHub workflows. Explore ideas around _prompt engineering_, _CI/CD_ actions, and _LLM_ model differences using this skeleton. Fork this project, then use it to create your own GitHub app. Configure the app with the needed permissions and secrets. If needed, create a [Langfuse][langfuse] account. Add initial prompts from `prompts/` to Langfuse. Install and configure the app on a repo and start creating PRs to `main` with this codebase running locally:

In one terminal, start smee.io routing to the local machine:

```sh
pnpm run smee
```

In a different terminal, run the probot in dev mode:

```sh
pnpm run dev:probot
```

All actions that trigger the Probot will now be redirected to your local machine. Both running processes can be terminated with Crtl-C.

## "Setup"

First, fork this repo and use it to [create a new GitHub App][setup]. Then create and set the appropriate secrets for your situation.

### Starting Prompts for Langfuse

These are generic, low-quality prompts to serve as starting points for experimenting with [Langfuse][langfuse]. Starting at this level makes any tuning done easily noticable and lets there be more rounds of revision when exploring the different parts of the overall system.

#### Initial `system` Prompt

```text
Provide your feedback in strict JSON format with the following structure, one JSON object per review. 
If there is one or more reviews where `this.ltgm == false`, do not incude items where `this.ltgm == true`:
[
  {
    "lgtm": boolean, // True if the code looks good to merge, false if there are concerns
    "path": string, // The path to the file being reviewed
    "body": string, // Your review comments. Use github markdown syntax in this string with code suggestions not included. Suggested code will be included in the 'suggestion' parameter of this object.
    "suggestion": string optional, // The code suggestion if any. Do not include this if there is no code suggestion. Code should be well formatted,multiple lines if needed, and a complete appliable snippet.
    "start_line": int optional // The line number where the code suggestion starts, only provided if a code suggestion is present
    "line": int // Either the line number where the suggestion ends, or the first line of the chunk if `this.ltgm == true`
  },
  ... // Repeat for each review
]
Ensure your response is a valid JSON array with no other markup.
```

#### Initial `user` Prompt

```text
Please review the following code patch. Create a review for each chunk in the patch. 
Focus on potential bugs, risks, and improvement suggestions. If needed, offer code fixes in the return comment with explanations upto 200 words. Otherwise comment ':+1: LGTM':
```

### Repository Secrets

Secrets can be stored with the app and used by all repositories that install the app, or with a repository using the app for repository specific settings.

* `APP_ID`\
  The GitHub App ID assigned when registering your app on GitHub
* `OPENAI_API_KEY`\
  API key for OpenAI services used by LangChain for code review functionality ([Create an OpenAI api key][openai-api-key]). **Note:** The code can easily be adjusted to use any of the models LangChain supports
* `PRIVATE_KEY`\
  The private key generated for your GitHub App during registration
* `WEBHOOK_SECRET`\
  A secret token to validate webhook payloads from GitHub

### Completing "Setup"

After deploying to Cloud Run for the first time, you need to update your app's webhook URL:

* Navigate to your app's settings page on GitHub.
* Under "Webhook URL", click **Edit**.
* Enter your Cloud Run service URL (e.g., `https://my-app-hash-region.run.app`).
* Click **Save changes**.

Your app will now receive webhook events at your Cloud Run service URL.

## Some of the Interesting Parts

### Prompt and Model Related Logic

#### `/src/cr-request.ts`

* Makes requests to LLM models via [LangChain][langchain]
* Gets and traces prompts via [Langfuse][langfuse]
* Sets a JSON schema for the LLM's response
* Builds the complete prompt that is submitted _per patch_

### probotApp defined in `/src/index.ts`

* `probotApp` that contains the logic executed durning the action.
* This is where to change the logic for when to call to `crReqeust`, which could make a large difference in how context could be provided to the LLM. The current process could be vastly improved, but was not the focus of this project.
* This is the most convenient place for logging and serves as a controller for the entire GitHub app.

## Docs for Context

I indexed the following docs to use as context while working on this codebase. Many AI tools will already have some of these already indexed in some way:

* Docker - <https://docs.docker.com/engine>
* GitHub Actions - <https://docs.github.com/en/actions>
* GitHub Probot - <https://probot.github.io/docs>
* Google Cloud Run - <https://cloud.google.com/run/docs>
* Javascript - <https://developer.mozilla.org/en-US/docs/Web/JavaScript>
* LangChain - <https://js.langchain.com/docs>
* Langfuse - <https://langfuse.com/docs>
* Typescript - <https://www.typescriptlang.org/docs>
* Vitest - <https://vitest.dev/guide>

## Potential Improvemnents and Additions

### Ability to Disable Review by Setting a Label

Currently all requests are are considered for code review. It would be a minor change to make code review conditional on a label/tag being set on the PR.

### IaC Managed by Terraform or Pulumi

This originally ran on [Google Cloud Run][cloud-run] with [Terraform][terraform], but it wasn't worth the complexity when I was getting the most use out of running the code locally, so I removed it. However, _IaC_ would be a natural next step if this grew into a real tool or was being used in multiple versions or across teams.

### Ability to use Other Models Including Ollama

[Langchain][langchain] has great support for Ollama models and there are compelling reasons beyond privacy to explore AI in private infrastructure. `src/cr-request.ts` is where the [Langchain][langchain] logic lives.

### Better installation/setup experience

More than a few people using this would justify some kind of setup script instead of these instructions.

[probot]: https://github.com/probot/probot "GitHub App framework"
[langchain]: https://www.langchain.com/ "Framework for developing applications powered by language models"
[langfuse]: https://langfuse.com/ "Open Source LLM Engineering Platform"
[cloud-run]: https://cloud.google.com/run "Serverless container platform"
[setup]: SETUP.md "Create Your Own GitHub App"
[terraform]: https://developer.hashicorp.com/terraform "Automate Infrastructure on Any Cloud"
[openai-api-key]: https://platform.openai.com/api-keys "OpenAI API Keys"
