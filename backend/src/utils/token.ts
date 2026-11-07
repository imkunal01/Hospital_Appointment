import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'PATIENT' | 'ADMIN';
}

/**
 * Sign a short-lived access JWT (15 minutes).
 */
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m'
  });
}

/**
 * Verify an access JWT. Throws jwt.TokenExpiredError or jwt.JsonWebTokenError.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

/**
 * Generate a cryptographically secure random refresh token (opaque string).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Hash a refresh token using SHA-256 for secure database storage.
 * We never store raw refresh tokens in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
