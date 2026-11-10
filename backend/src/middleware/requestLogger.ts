import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import morgan from 'morgan';
import chalk from 'chalk';
import { env } from '../config/env.js';
import { logger, chalkTokens } from '../utils/logger.js';

/**
 * Middleware that assigns a unique Request ID (UUID v4) or preserves an incoming X-Request-ID.
 * Guarantees that every request and log entry can be correlated end-to-end.
 */
export function requestCorrelation(req: Request, res: Response, next: NextFunction): void {
  const incomingId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  const requestId = incomingId && incomingId.trim().length > 0 ? incomingId.trim() : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// -----------------------------------------------------------------------------
// Morgan HTTP Access Logger Setup (with Chalk color-coding & Winston alignment)
// -----------------------------------------------------------------------------

morgan.token('req-id', (req: Request) => req.id || (req.headers['x-request-id'] as string) || '-');

morgan.token('time-stamp', () => {
  const rawDate = new Date();
  const timeFormatted = rawDate.toTimeString().split(' ')[0] + '.' + String(rawDate.getMilliseconds()).padStart(3, '0');
  return chalk.gray(`[${timeFormatted}]`);
});

morgan.token('colored-method', (req: Request) => {
  return chalkTokens.method(req.method);
});

morgan.token('colored-status', (_req: Request, res: Response) => {
  return chalkTokens.status(res.statusCode);
});

/**
 * Morgan HTTP logger middleware with custom colored formatting and correlation tracking.
 * Visually harmonized with Winston application log entries for uniform terminal readability.
 */
export const morganLogger = morgan(
  (tokens, req, res) => {
    const rawTime = tokens['response-time'](req, res);
    const ms = parseFloat(rawTime || '0');
    const str = `${ms.toFixed(1)}ms`;
    const coloredDuration = ms >= 1000 ? chalk.red.bold(str) : ms >= 250 ? chalk.yellow(str) : chalk.magenta(str);

    return [
      tokens['time-stamp'](req, res),
      chalkTokens.http,
      tokens['colored-method'](req, res),
      chalk.whiteBright(tokens.url(req, res)),
      tokens['colored-status'](req, res),
      coloredDuration,
      chalk.gray(`(id: ${tokens['req-id'](req, res)})`)
    ].join(' ');
  },
  {
    skip: (req) => {
      // In test mode or for /health pings, suppress morgan stdout to keep test output clean
      return env.NODE_ENV === 'test' || req.url === '/health';
    }
  }
);

/**
 * Structured HTTP access logging middleware for Winston.
 * Emits JSON-structured request completion logs with correlation ID and duration on response finish.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const isHealthCheck = req.path === '/health';
    const statusCode = res.statusCode;

    const logData: Record<string, any> = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs
    };

    if (req.user?.userId) {
      logData.userId = req.user.userId;
    }

    const message = `HTTP ${req.method} ${req.originalUrl || req.url} ${statusCode} (${durationMs}ms)`;

    // Keep health checks at debug level to avoid polluting high-throughput log streams
    if (isHealthCheck) {
      logger.debug(message, logData);
      return;
    }

    if (statusCode >= 500) {
      logger.error(message, undefined, logData);
    } else if (statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
}
