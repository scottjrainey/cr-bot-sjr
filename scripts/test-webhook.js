#!/usr/bin/env node

// This script simulates a GitHub webhook to test your local development
// Usage: node scripts/test-webhook.js [event-type] [payload-file]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const eventType = process.argv[2] || 'ping';
const payloadFile = process.argv[3] || path.join(__dirname, 'ping-payload.json');

// Default target
const targetUrl = process.env.TARGET_URL || 'http://localhost:8080';

// Read payload file
if (!fs.existsSync(payloadFile)) {
  console.error(`Payload file not found: ${payloadFile}`);
  process.exit(1);
}

const webhookSecret = process.env.WEBHOOK_SECRET || 'development';
const payload = fs.readFileSync(payloadFile, 'utf-8');
const payloadObj = JSON.parse(payload);

// Generate signature
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

// Generate delivery ID
const deliveryId = crypto.randomUUID();

console.log(`Sending ${eventType} event to ${targetUrl}`);
console.log(`Payload: ${payloadFile}`);
console.log(`Signature: sha256=${signature}`);
console.log(`Delivery ID: ${deliveryId}`);

// Send request
fetch(targetUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': eventType,
    'X-GitHub-Delivery': deliveryId,
    'X-Hub-Signature-256': `sha256=${signature}`
  },
  body: payload
})
.then(async response => {
  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log(`Response: ${text}`);
})
.catch(error => {
  console.error('Error:', error);
});