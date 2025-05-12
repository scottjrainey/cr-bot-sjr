import { Probot, Server } from 'probot';
import probotApp from './index.js';

const PORT = 8080;

type ValidLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function getValidLogLevel() {
  const level = process.env.LOG_LEVEL;
  const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

  if (level && validLevels.includes(level)) {
    return level as ValidLogLevel;
  }

  return 'info'; // Default log level
}

// Create a Probot server with your app
const server = new Server({
  port: PORT,
  webhookPath: '/',
  Probot: Probot.defaults({
    // These would be read from env vars automatically
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    secret: process.env.WEBHOOK_SECRET,
    logLevel: getValidLogLevel(),
  })
});

// Load your app
server.load(probotApp);

// Add health check endpoint
server.expressApp.get('/health', (_, res) => {
  res.status(200).send('OK');
});

// Call start without arguments
server.start().then(() => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
