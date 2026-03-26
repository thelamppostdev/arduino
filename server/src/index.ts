import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { ArduinoManager } from './arduino.js';
import { createRoutes } from './routes.js';
import { SystemMonitor } from './monitor.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Arduino connection
const arduino = new ArduinoManager();
const monitor = new SystemMonitor(arduino);

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
      } else if (msg.type === 'monitor-pulse') {
        const speed = Math.max(10, Math.min(200, msg.speed || 60));
        arduino.write(`mpulse-${speed}`);
      } else if (msg.type === 'reactor-restart') {
        arduino.write('rrestart');
      } else if (msg.type === 'reactor-config') {
        const maxB = Math.max(5, Math.min(30, msg.maxBright || 18));
        const minB = Math.max(1, Math.min(maxB, msg.minBright || 8));
        const spin = Math.max(1, Math.min(10, msg.spinRate || 1));
        const initSpin = Math.max(2, Math.min(10, msg.initSpinRate || 6));
        arduino.write(`rconfig-${maxB}-${minB}-${spin}-${initSpin}`);
      } else if (msg.type === 'aurora-bright') {
        const min = Math.max(1, Math.min(30, msg.min || 6));
        const max = Math.max(min, Math.min(30, msg.max || 20));
        arduino.write(`abright-${min}-${max}`);
      } else if (msg.type === 'monitor') {
        if (msg.action === 'start') {
          monitor.start((stats) => {
            const payload = JSON.stringify({ type: 'monitor-stats', ...stats });
            for (const client of wss.clients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            }
          });
        } else if (msg.action === 'stop') {
          monitor.stop();
        }
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
  monitor.stop();
  wss.close();
  await arduino.disconnect();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
