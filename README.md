# cr-bot-sjr

> A simple **proof-of-concept** _AI_ code review bot using GitHub's
> [Probot][probot], [LangChain][langchain], and [Google Cloud Run][cloud-run]
> to experiment with _AI/LLM_ use in _CI/CD_ workflows on _serverless infrastructure_

**< WARNING: NOT INTENDED FOR PRODUCTION USE >**\
This started as personal project to experiment with Cursor as an IDE, code 0 to 1 on a project using AI assistance, and to write code that interacts with _LLM APIs_. I chose to use [Google Cloud Run][cloud-run] and [Probot][probot] (a part of the GitHub Actions universe) simply because I'd been using _AWS_ and _Jenkins_ at work.

To be clear, **this is not meant to compete with or replace Copilot**. It is meant to provide a workspace to play with LLMs in workflows. The prompts used in this project a makeshift and meant to generate demo output without much regard for quality of response. That said, prompts can be changed easily and set on a _per project_ basis.\
**</ WARNING: NOT INTENDED FOR PRODUCTION USE >**

## TL;DR

Experiment with LLMs in non-production GitHub workflows. Flesh out ideas around _prompt engineering_, _CI/CD_ actions, and _LLM_ model differences building on this skeleton. Fork this project, then use it to create your own GitHub app. Configure the app with the needed permissions and secrets. Deploy to [Google Cloud Run][cloud-run]. Install and configure the app on a repo and start creating PRs to `main`.

## Setup

First, fork this repo and use it to [create a new GitHub App][setup]. Then create and set the appropriate secrets for your situation.

### Repository Secrets

Secrets can be stored with the app and used by all repositories that install the app, or with a repository using the app for repository specific settings.

* `APP_ID`\
  The GitHub App ID assigned when registering your app on GitHub
* `GCP_REGION`\
  The Google Cloud Platform region where the Cloud Run service will be deployed (e.g. us-central1)
* `GCP_SA_KEY`\
  JSON key file for a Google Cloud Service Account with permissions to deploy to Cloud Run
* `OPENAI_API_KEY`\
  API key for OpenAI services used by LangChain for code review functionality ([Create an OpenAI api key][openai-api-key]). **Note:** The code can easily be adjusted to use any of the models LangChain supports
* `PRIVATE_KEY`\
  The private key generated for your GitHub App during registration
* `WEBHOOK_SECRET`\
  A secret token to validate webhook payloads from GitHub

### Google Cloud Run Setup

Coming soon...

### First Deployment and Completing Setup

After deploying to Cloud Run for the first time, you need to update your app's webhook URL:

* Navigate to your app's settings page on GitHub.
* Under "Webhook URL", click **Edit**.
* Enter your Cloud Run service URL (e.g., `https://my-app-hash-region.run.app`).
* Click **Save changes**.

Your app will now receive webhook events at your Cloud Run service URL.

## Some of the Interesting Parts

### Prompt and Model Related Logic

#### `/src/cr-request.ts`

* Interacts with the LLM models via LangChain
* Sets a JSON schema for the LLM's response
* Builds the complete prompt that is submitted _per patch_

#### `/.github/cr-bot-sjr.yml`

### probotApp defined in `/src/index.ts`

* `probotApp` that contains the logic executed durning the action
* This is where to change the logic for when to call to `crReqeust`, which could make a large difference in how context could be provided to the LLM. The current process could be vastly improved, but was not the focus of this project.

## Docs for Context

I indexed the following docs to use as context while working on this codebase. Many AI tools will already have some of these already indexed in some way:

* Docker - <https://docs.docker.com/engine/>
* GitHub Actions - <https://docs.github.com/en/actions>
* GitHub Probot - <https://probot.github.io/docs/>
* Google Cloud Run - <https://cloud.google.com/run/docs>
* Javascript - <https://developer.mozilla.org/en-US/docs/Web/JavaScript>
* LangChain - <https://js.langchain.com/docs/>
* Typescript - <https://www.typescriptlang.org/docs/>
* Vitest - <https://vitest.dev/guide/>

## Roadmap

### Ability to Disable Review by Setting a Label

### IaC Managed by Terraform or Pulumi

### Ability to use Other Models Including Ollama

### Better prompt management and customization

### Better installation/setup experience

## Contributing

If you have suggestions for how cr-bot-sjr could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide][contributing].

## License

[MIT](LICENSE) © 2025 scottjrainey

[probot]: https://github.com/probot/probot "GitHub App framework"
[langchain]: https://www.langchain.com/ "Framework for developing applications powered by language models"
[cloud-run]: https://cloud.google.com/run "Serverless container platform"
[contributing]: CONTRIBUTING.md "Guidelines for contributing to this project"
[setup]: SETUP.md "Create Your Own GitHub App"
[openai-api-key]: https://platform.openai.com/api-keys "OpenAI API Keys"
