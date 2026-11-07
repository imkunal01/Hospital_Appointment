import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken
} from '../../utils/token.js';
import { LoginInput } from './auth.schema.js';

export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'PATIENT' | 'ADMIN';
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds (900s = 15m)
}

export async function loginUser(input: LoginInput): Promise<AuthSessionResponse> {
  const result = await query(
    'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
    [input.email]
  );

  const user = result.rows[0];
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Generate 15-minute access JWT
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  // Generate 7-day random refresh token
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Persist hashed refresh token
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: 900 // 15 minutes
  };
}

export async function refreshAccessToken(rawRefreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const tokenHash = hashToken(rawRefreshToken);

  const result = await query(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.email, u.role
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  const tokenRecord = result.rows[0];

  if (!tokenRecord) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  if (tokenRecord.revoked_at) {
    throw AppError.unauthorized('Refresh token has been revoked');
  }

  if (new Date() > new Date(tokenRecord.expires_at)) {
    throw AppError.unauthorized('Refresh token has expired');
  }

  const accessToken = signAccessToken({
    userId: tokenRecord.user_id,
    email: tokenRecord.email,
    role: tokenRecord.role
  });

  return {
    accessToken,
    expiresIn: 900
  };
}

export async function logoutUser(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);

  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash]
  );
}
