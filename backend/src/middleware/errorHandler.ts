import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;
  const path = req.originalUrl || req.url;
  const method = req.method;

  // 1. Handled AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`Server error: ${err.message}`, err, {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        path,
        method
      });
    } else {
      logger.warn(`Operational error: ${err.code} - ${err.message}`, {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        path,
        method,
        ...(err.details ? { details: err.details } : {})
      });
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
    return;
  }

  // 2. Zod validation error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    logger.warn('Request validation failed', {
      requestId,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      path,
      method,
      details: formattedErrors
    });

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details: formattedErrors
      }
    });
    return;
  }

  // 3. Syntax error in body JSON
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON payload', {
      requestId,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      path,
      method
    });

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload'
      }
    });
    return;
  }

  // 4. Unhandled Internal Server Errors (Do NOT leak stack or internal details)
  logger.error('Unhandled internal server error', err, {
    requestId,
    path,
    method
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'An unexpected internal server error occurred'
    }
  });
}
