import { Router } from 'express';
import { ArduinoManager } from './arduino.js';

const COLORS = [
  { name: 'red', rgb: '#FF0000' },
  { name: 'orange', rgb: '#FF8000' },
  { name: 'yellow', rgb: '#FFFF00' },
  { name: 'lime', rgb: '#80FF00' },
  { name: 'green', rgb: '#00FF00' },
  { name: 'teal', rgb: '#00FF80' },
  { name: 'marine', rgb: '#00FFFF' },
  { name: 'blue', rgb: '#0000FF' },
  { name: 'purple', rgb: '#7F00FF' },
  { name: 'magenta', rgb: '#FF00FF' },
  { name: 'pink', rgb: '#FF007F' },
  { name: 'white', rgb: '#FFFFFF' },
];

const ANIMATIONS = ['fire', 'pulse', 'progress'];

export function createRoutes(arduino: ArduinoManager): Router {
  const router = Router();

  router.get('/colors', (_req, res) => {
    res.json(COLORS);
  });

  router.get('/animations', (_req, res) => {
    res.json(ANIMATIONS);
  });

  router.get('/status', (_req, res) => {
    res.json(arduino.getStatus());
  });

  router.post('/ring', (req, res) => {
    const { color, animation } = req.body;

    if (!color) {
      res.status(400).json({ error: 'color is required' });
      return;
    }

    const validColor = COLORS.find(c => c.name.toLowerCase() === color.toLowerCase());
    if (!validColor) {
      res.status(400).json({ error: `Unknown color: ${color}` });
      return;
    }

    if (animation && !ANIMATIONS.includes(animation.toLowerCase())) {
      res.status(400).json({ error: `Unknown animation: ${animation}` });
      return;
    }

    let command = `ring-${validColor.name}`;
    if (animation) {
      command += `-${animation.toLowerCase()}`;
    }

    const success = arduino.write(command);
    res.json({ success, command });
  });

  return router;
}
