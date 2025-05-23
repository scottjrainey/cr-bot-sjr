# Create Your Own GitHub App

To create your own GitHub App from your fork of the repository, follow these steps:

## Register a GitHub App

You need to register your GitHub App with the necessary settings.

* In the upper-right corner of any page on GitHub, click your avatar.
* Navigate to your account settings:
  * For an app owned by a personal account, click **Settings**.
  * For an app owned by an organization:
    * Click **Your organizations**.
    * To the right of the organization, click **Settings**.
* In the left sidebar, click **Developer settings**.
* In the left sidebar, click **GitHub Apps**.
* Click **New GitHub App**.
* Fill out the required fields:
  * **GitHub App name**: Enter a name for your app.
  * **Homepage URL**: Enter the URL of your forked repository (e.g., `https://github.com/YOUR_USERNAME/cr-bot-sjr`).
  * **Webhook URL**: If you plan to test locally, use a webhook proxy URL (e.g., from Smee.io). For production, use your server's URL.
  * **Webhook secret**: Enter a random string to use as the webhook secret.
* Under "Repository permissions," select the permissions required:
  * **Read** for **Content** and **Metadata**
  * **Read** and **write** access to **Variables**, **Issues**, and **Pull requests**
* Under "Subscribe to events," select the events your app needs to respond to:
  * **Issues** and **Pull request**
* Under "Where can this GitHub App be installed?", select **Only on this account** or **Any account**, depending on your preference.
* Click **Create GitHub App**.

## Generate a Private Key

* On your app's settings page, under "Private keys," click **Generate a private key**.
* A private key in PEM format will be downloaded to your computer. Save this file securely.

## Store App Credentials

* In your forked repository, create a `.env` file at the top level.
* Add the following contents to the `.env` file:

  ```sh
  APP_ID="YOUR_APP_ID"
  WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"
  PRIVATE_KEY="YOUR_PRIVATE_KEY"
  ```

  Replace:
  * `YOUR_APP_ID` with the App ID from your app's settings page.
  * `YOUR_WEBHOOK_SECRET` with the webhook secret you set earlier.
  * `YOUR_PRIVATE_KEY` The full text of your private key file.

* Add `.env` to your `.gitignore` file to prevent committing sensitive information.

## Install Dependencies

* Navigate to your forked repository's directory in a terminal.
* Run `npm install` to install the dependencies listed in the repository's `package.json`.

## Install Your App on a Different Repository

* Navigate to your app's settings page.
* Click **Public page**.
* Click **Install**.
* Select **Only select repositories**.
* Choose the repository where you want to install the app.
* Click **Install**.

## Start Your Server

* If testing locally, use Smee.io to forward webhooks:
  * Run `npx smee -u WEBHOOK_PROXY_URL -t http://localhost:3000/api/webhook` in a terminal, replacing `WEBHOOK_PROXY_URL` with your Smee.io URL.
* In another terminal window, navigate to your forked repository's directory.
* Run `npm run server` to start your app's server.

## Test Your App

* Open a pull request in the repository where your app is installed.
* Check your webhook proxy URL (e.g., Smee.io) to confirm that webhook events are being forwarded.
* Verify that your app responds to the event (e.g., by leaving a comment on the pull request).

For more details, see [Building a GitHub App that responds to webhook events](https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-github-app-that-responds-to-webhook-events).
