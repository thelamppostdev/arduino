import os from 'os';
import { execSync } from 'child_process';
import { ArduinoManager } from './arduino.js';
import { logger } from './logger.js';

interface CpuSnapshot {
  idle: number;
  total: number;
}

export class SystemMonitor {
  private arduino: ArduinoManager;
  private interval: ReturnType<typeof setInterval> | null = null;
  private prevCpu: CpuSnapshot | null = null;
  private onStats: ((stats: { cpu: number; memory: number; cpuLevel: number; memLevel: number }) => void) | null = null;

  constructor(arduino: ArduinoManager) {
    this.arduino = arduino;
  }

  start(callback?: typeof this.onStats) {
    this.stop();
    this.onStats = callback ?? null;
    this.prevCpu = this.getCpuSnapshot();

    // Set animation mode to monitor (no-op animation, levels command drives display)
    this.arduino.write('ring-red-monitor');

    this.interval = setInterval(() => this.poll(), 1500);
    logger.info('System monitor started (overlay mode)');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.prevCpu = null;
      logger.info('System monitor stopped');
    }
  }

  isRunning() {
    return this.interval !== null;
  }

  private getCpuSnapshot(): CpuSnapshot {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
    }
    return { idle, total };
  }

  private getCpuPercent(): number {
    const current = this.getCpuSnapshot();
    if (!this.prevCpu) {
      this.prevCpu = current;
      return 0;
    }
    const idleDiff = current.idle - this.prevCpu.idle;
    const totalDiff = current.total - this.prevCpu.total;
    this.prevCpu = current;
    if (totalDiff === 0) return 0;
    return Math.round((1 - idleDiff / totalDiff) * 100);
  }

  private getMemoryPercent(): number {
    try {
      const output = execSync('vm_stat', { encoding: 'utf-8' });
      const pageSize = 16384;
      const parse = (label: string): number => {
        const match = output.match(new RegExp(`${label}:\\s+(\\d+)`));
        return match ? parseInt(match[1]) : 0;
      };
      const free = parse('Pages free');
      const inactive = parse('Pages inactive');
      const speculative = parse('Pages speculative');
      const purgeable = parse('Pages purgeable');
      const available = (free + inactive + speculative + purgeable) * pageSize;
      const total = os.totalmem();
      return Math.round((1 - available / total) * 100);
    } catch {
      return Math.round((1 - os.freemem() / os.totalmem()) * 100);
    }
  }

  private poll() {
    const cpu = this.getCpuPercent();
    const memory = this.getMemoryPercent();
    const cpuLevel = Math.round((cpu / 100) * 12);
    const memLevel = Math.round((memory / 100) * 12);

    this.arduino.write(`levels-${cpuLevel}-${memLevel}`);

    if (this.onStats) {
      this.onStats({ cpu, memory, cpuLevel, memLevel });
    }
  }
}
