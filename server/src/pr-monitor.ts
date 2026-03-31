import { execSync } from 'child_process';
import { ArduinoManager } from './arduino.js';
import { logger } from './logger.js';

export interface CheckInfo {
  name: string;
  status: string;
  conclusion: string;
  statusChar: string;
}

export class PRMonitor {
  private arduino: ArduinoManager;
  private interval: ReturnType<typeof setInterval> | null = null;
  private repo: string = '';
  private prNumber: number = 0;
  private onChecks: ((checks: CheckInfo[]) => void) | null = null;
  private pollIntervalSec: number = 15;

  constructor(arduino: ArduinoManager) {
    this.arduino = arduino;
  }

  start(repo: string, prNumber: number, intervalSec: number = 15, callback?: typeof this.onChecks) {
    this.stop();
    this.repo = repo;
    this.prNumber = prNumber;
    this.onChecks = callback ?? null;
    this.pollIntervalSec = intervalSec;

    // Set animation mode to checks
    this.arduino.write('ring-white-checks');

    // Poll immediately, then at configured interval
    this.poll();
    this.interval = setInterval(() => this.poll(), this.pollIntervalSec * 1000);
    logger.info(`PR monitor started: ${repo}#${prNumber} (${intervalSec}s)`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('PR monitor stopped');
    }
  }

  setPollInterval(sec: number) {
    this.pollIntervalSec = Math.max(5, Math.min(60, sec));
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = setInterval(() => this.poll(), this.pollIntervalSec * 1000);
      logger.info(`PR monitor interval changed to ${this.pollIntervalSec}s`);
    }
  }

  isRunning() {
    return this.interval !== null;
  }

  getWatching() {
    if (!this.isRunning()) return null;
    return { repo: this.repo, pr: this.prNumber };
  }

  private poll() {
    try {
      const raw = execSync(
        `gh pr view ${this.prNumber} --repo ${this.repo} --json statusCheckRollup`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      const data = JSON.parse(raw);
      // Deduplicate by name — keep the last entry (most recent run)
      const rawChecks: any[] = data.statusCheckRollup || [];
      const deduped = new Map<string, any>();
      for (const c of rawChecks) {
        deduped.set(c.name, c);
      }
      const checks: CheckInfo[] = [...deduped.values()].map((c: any) => {
        let statusChar = 'Q';
        if (c.status === 'COMPLETED') {
          if (c.conclusion === 'SUCCESS') statusChar = 'S';
          else if (c.conclusion === 'SKIPPED' || c.conclusion === 'NEUTRAL') statusChar = 'K';
          else statusChar = 'F';
        } else if (c.status === 'IN_PROGRESS') {
          statusChar = 'P';
        }
        return {
          name: c.name,
          status: c.status,
          conclusion: c.conclusion || '',
          statusChar,
        };
      });

      // Send to Arduino: checks-<count>-<statuses>
      const statusStr = checks.map(c => c.statusChar).join('');
      this.arduino.write(`checks-${checks.length}-${statusStr}`);

      if (this.onChecks) {
        this.onChecks(checks);
      }
    } catch (err: any) {
      logger.warn(`PR monitor poll failed: ${err.message}`);
    }
  }

  static listRepos(query: string): { nameWithOwner: string }[] {
    try {
      const raw = execSync(
        `gh repo list ${query} --json nameWithOwner --limit 500`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static listPRs(repo: string): { number: number; title: string; headRefName: string }[] {
    try {
      const raw = execSync(
        `gh pr list --repo ${repo} --json number,title,headRefName --limit 20`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}
