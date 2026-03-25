import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { ArduinoManager } from './arduino.js';
import { createRoutes } from './routes.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Arduino connection
const arduino = new ArduinoManager();

// API routes
app.use('/api', createRoutes(arduino));

// Serve static client build in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// HTTP + WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastStatus() {
  const status = JSON.stringify({ type: 'status', data: arduino.getStatus() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(status);
    }
  }
}

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');
  ws.send(JSON.stringify({ type: 'status', data: arduino.getStatus() }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ring' && msg.color) {
        let command = `ring-${msg.color}`;
        if (msg.animation) command += `-${msg.animation}`;
        arduino.write(command);
      }
    } catch {
      // ignore malformed messages
    }
  });
});

// Broadcast status changes
arduino.on('ready', broadcastStatus);
arduino.on('disconnected', broadcastStatus);
arduino.on('reconnected', broadcastStatus);

// Start
async function start() {
  try {
    await arduino.connect();
  } catch (error: any) {
    logger.warn(`Could not connect to Arduino on startup: ${error.message}`);
    logger.warn('Server will start anyway — Arduino can be connected later');
  }

  server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  wss.close();
  await arduino.disconnect();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
