import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export class Logger {
  private logDir: string;
  private logFile: string;

  constructor(serviceName: string = 'lamppost') {
    this.logDir = path.join(os.homedir(), 'Library', 'Logs', 'lamppost');
    this.logFile = path.join(this.logDir, `${serviceName}.log`);
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}`;
  }

  private writeLog(level: LogLevel, message: string) {
    const formattedMessage = this.formatMessage(level, message);
    fs.appendFileSync(this.logFile, formattedMessage + '\n');
    console.log(formattedMessage);
  }

  error(message: string) { this.writeLog(LogLevel.ERROR, message); }
  warn(message: string) { this.writeLog(LogLevel.WARN, message); }
  info(message: string) { this.writeLog(LogLevel.INFO, message); }
  debug(message: string) { this.writeLog(LogLevel.DEBUG, message); }
}

export const logger = new Logger();
