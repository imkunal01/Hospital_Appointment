import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const loginStore = new Map<string, RateLimitRecord>();

/**
 * Lightweight in-memory rate limiter for sensitive routes like /auth/login.
 * Default: 10 requests per 15 minutes per IP.
 */
export function loginRateLimiter(maxRequests = 10, windowMs = 15 * 60 * 1000) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // In test environment, bypass rate limit to avoid false-failing test suites
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = loginStore.get(ip);

    if (!record || now > record.resetAt) {
      loginStore.set(ip, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      return next(
        AppError.rateLimited(`Too many login attempts. Please try again in ${waitSeconds} seconds.`)
      );
    }

    record.count += 1;
    next();
  };
}

// Cleanup stale entries every 10 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginStore.entries()) {
    if (now > record.resetAt) {
      loginStore.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();

