export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'SLOT_TAKEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static validation(message: string, details?: any): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static tokenExpired(message = 'Session token expired'): AppError {
    return new AppError(401, 'TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'Access forbidden'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Requested resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static slotTaken(message = 'Selected appointment slot is no longer available'): AppError {
    return new AppError(409, 'SLOT_TAKEN', message);
  }

  static rateLimited(message = 'Too many requests, please try again later'): AppError {
    return new AppError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'An unexpected server error occurred'): AppError {
    return new AppError(500, 'INTERNAL', message);
  }
}

