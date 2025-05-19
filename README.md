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

## License

[ISC](LICENSE) © 2025 scottjrainey

## Versioning

This project uses [release-please](https://github.com/googleapis/release-please) for versioning. Commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - Minor version bump (1.x.0)
- `fix:` - Patch version bump (1.0.x)
- `feat!:` or `BREAKING CHANGE:` - Major version bump (x.0.0)
- `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:` - No version bump
