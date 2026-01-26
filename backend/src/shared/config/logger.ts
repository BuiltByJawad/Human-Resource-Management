import winston from 'winston';
import path from 'path';
import { createStream } from 'rotating-file-stream';
import { Request, Response } from 'express';
import { NODE_ENV, LOG_LEVEL, LOG_FILE_PATH } from './config';

// Ensure log directory exists
const logDirectory = path.join(process.cwd(), LOG_FILE_PATH);

// Create a rotating write stream for access logs
const accessLogStream = createStream('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory,
  compress: 'gzip', // compress rotated files
});

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'hrm-backend' },
  transports: [
    // Write logs to console in production and development (best for cloud/containers)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Only write to files in development if needed
    ...(process.env.NODE_ENV === 'development'
      ? [
        new winston.transports.File({
          filename: path.join(logDirectory, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(logDirectory, 'combined.log'),
        }),
      ]
      : []),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// Add console logging in development
if (NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create a stream object with a 'write' function that will be used by `morgan`
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Logging middleware
const logRequest = (req: Request, res: Response, next: Function) => {
  logger.info(`[${req.method}] ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body,
    query: req.query,
    params: req.params,
    requestId: (req as Request & { requestId?: string }).requestId,
  });
  next();
};

// Log errors
const logError = (error: Error) => {
  logger.error(error.message, { stack: error.stack });
};

export { logger, stream, logRequest, logError };

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Optionally exit the process if needed
  // process.exit(1);
});
