import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(AppError.tokenExpired('Session token expired. Please refresh your session.'));
    }
    return next(AppError.unauthorized('Invalid authorization token'));
  }
}

export function requireRole(...allowedRoles: Array<'PATIENT' | 'ADMIN'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}
