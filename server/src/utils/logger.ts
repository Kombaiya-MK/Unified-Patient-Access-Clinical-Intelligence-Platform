import winston from 'winston';
import Transport from 'winston-transport';
import path from 'path';
import fs from 'fs';
import os from 'os';
import config from '../config/env';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isWindows = os.platform() === 'win32';
const isProduction = config.nodeEnv === 'production';

// Production Windows log directory (C:\Logs\UPACI\)
const windowsLogDir = process.env.WINDOWS_LOG_PATH || 'C:\\Logs\\UPACI';

if (isProduction && isWindows) {
  if (!fs.existsSync(windowsLogDir)) {
    try {
      fs.mkdirSync(windowsLogDir, { recursive: true });
    } catch {
      // Directory creation may fail without admin rights; setup-logging.ps1 handles this
    }
  }
}

/**
 * Custom Winston transport for Windows Event Log using node-windows EventLogger.
 * Only active in production on Windows.
 */
class WindowsEventLogTransport extends Transport {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eventLogger: any = null;

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    if (isWindows) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { EventLogger } = require('node-windows');
        this.eventLogger = new EventLogger('UPACI');
      } catch {
        // node-windows not available; skip Event Log transport
      }
    }
  }

  log(info: { level: string; message: string; [key: string]: unknown }, callback: () => void): void {
    if (!this.eventLogger) {
      callback();
      return;
    }

    setImmediate(() => this.emit('logged', info));

    const msg = `${info.message}${info.stack ? `\n${info.stack}` : ''}`;
    switch (info.level) {
      case 'error':
        this.eventLogger.error(msg);
        break;
      case 'warn':
        this.eventLogger.warn(msg);
        break;
      default:
        this.eventLogger.info(msg);
        break;
    }

    callback();
  }
}

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  }),
);

/**
 * Build transport list based on environment and platform
 */
const transports: winston.transport[] = [
  // Console transport (always active)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),

  // File transport for all logs (development path)
  new winston.transports.File({
    filename: config.logging.filePath,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Separate file for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Production Windows transports
if (isProduction && isWindows) {
  // Windows Event Log transport (Application log, source: UPACI)
  transports.push(new WindowsEventLogTransport({ level: 'warn' }));

  // Production file transport with daily rotation at C:\Logs\UPACI\
  transports.push(
    new winston.transports.File({
      filename: path.join(windowsLogDir, 'backend.log'),
      maxsize: 104857600, // 100MB
      maxFiles: 30,
    }),
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(windowsLogDir, 'backend-error.log'),
      level: 'error',
      maxsize: 104857600, // 100MB
      maxFiles: 30,
    }),
  );
}

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

/**
 * Stream for Morgan HTTP logger
 */
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
