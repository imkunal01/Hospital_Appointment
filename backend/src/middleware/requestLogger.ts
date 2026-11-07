import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

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

/**
 * HTTP access logging middleware.
 * Emits structured request completion logs on response finish.
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
