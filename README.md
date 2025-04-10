# cr-bot-sjr

> A GitHub App built with [Probot](https://github.com/probot/probot) that Simple AI Code review bot

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t cr-bot-sjr .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> cr-bot-sjr
```

## Contributing

If you have suggestions for how cr-bot-sjr could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

Bump

## License

[ISC](LICENSE) © 2025 scottjrainey
