import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handled AppError
  if (err instanceof AppError) {
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
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload'
      }
    });
    return;
  }

  // 4. Unhandled Internal Server Errors (Do NOT leak stack or internal details)
  console.error('Unhandled internal error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'An unexpected internal server error occurred'
    }
  });
}
