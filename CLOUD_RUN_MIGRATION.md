# Migration from Cloud Functions to Cloud Run

This document outlines the changes made to migrate the GitHub App from Google Cloud Functions to Google Cloud Run for improved reliability and timeout handling.

## Summary of Changes

1. **Asynchronous Processing**:
   - Modified `webhookHandler` to acknowledge webhooks immediately (202 status)
   - Added asynchronous processing to prevent GitHub webhook timeouts

2. **Server Implementation**:
   - Utilizing `server.ts` to run as a long-lived service
   - Added health check endpoint at `/health`
   - Improved event filtering to quickly respond to non-essential events

3. **Containerization**:
   - Updated Dockerfile to build and run the container properly
   - Set up to use pnpm for dependency management

4. **Deployment**:
   - Changed GitHub Actions workflow to deploy to Cloud Run instead of Cloud Functions
   - Added container building and pushing to Google Container Registry
   - Set up Cloud Run with extended timeouts and warm instances
   - Configured automatic webhook URL updates

5. **Local Development**:
   - Added helper scripts for testing webhooks locally
   - Improved smee.io integration
   - Added Docker scripts for local container testing

## Key Benefits

1. **Longer Processing Time**: Cloud Run allows up to 15 minutes for processing (vs. 9 minutes for Cloud Functions)
2. **Warm Instances**: Configured minimum instance count to prevent cold starts
3. **Better Scaling**: More configurable scaling options for handling traffic spikes
4. **Cost Efficiency**: Pay only for what you use, with more predictable pricing
5. **Improved Reliability**: Immediate webhook acknowledgment prevents GitHub timeout issues

## How to Test Locally

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run the server locally
pnpm server

# Test with a ping webhook (in another terminal)
pnpm test-webhook ping scripts/ping-payload.json

# Test with a PR webhook
pnpm test-webhook pull_request scripts/pr-opened-payload.json

# Test with Docker
pnpm docker-build
pnpm docker-run
```

## Monitoring

Cloud Run provides built-in monitoring for:
- Request logs
- Error rates
- Processing times
- Instance counts

You can access these metrics in the Google Cloud Console under the Cloud Run section.

## Troubleshooting

If you encounter issues:

1. Check the logs in Google Cloud Console
2. Verify environment variables are set correctly
3. Test the health check endpoint: `curl https://your-service-url/health`
4. Use the test-webhook script to send test events
5. Check that the GitHub App webhook URL points to your Cloud Run service

## Performance Improvements

We've added detailed performance logging throughout the code:

- `console.time()` and `console.timeEnd()` for measuring performance of key operations
- Improved error handling with specific error types
- Better logging of request and response information

## Environment Variables

The service requires these environment variables:

- `APP_ID`: GitHub App ID
- `PRIVATE_KEY`: GitHub App private key (with newlines)
- `WEBHOOK_SECRET`: Secret for validating webhook payloads
- `OPENAI_API_KEY`: OpenAI API key for code reviews