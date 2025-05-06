import express from 'express';
import { webhookHandler } from './index.js';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Main webhook endpoint
app.post('/', (req, res) => {
  webhookHandler(req, res);
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).send('OK');
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});