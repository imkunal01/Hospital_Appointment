import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken
} from '../../utils/token.js';
import { LoginInput, RegisterInput, GoogleAuthInput } from './auth.schema.js';

export interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  role: 'PATIENT' | 'ADMIN';
  phone?: string | null;
  phoneVerified?: boolean;
  dob?: string | null;
  location?: string | null;
  onboardingCompleted: boolean;
  authProvider?: 'LOCAL' | 'GOOGLE';
}

export interface AuthSessionResponse {
  user: UserProfileDTO;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds (900s = 15m)
}

function mapUserRowToDTO(user: any): UserProfileDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    phoneVerified: Boolean(user.phone_verified),
    dob: user.dob ? user.dob.toISOString ? user.dob.toISOString().split('T')[0] : String(user.dob) : null,
    location: user.location ?? null,
    onboardingCompleted: Boolean(user.onboarding_completed),
    authProvider: user.auth_provider ?? 'LOCAL'
  };
}

async function createTokensForUser(user: { id: string; email: string; role: 'PATIENT' | 'ADMIN' }) {
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

  return { accessToken, rawRefreshToken };
}

export async function loginUser(input: LoginInput): Promise<AuthSessionResponse> {
  const result = await query(
    `SELECT id, email, password_hash, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider 
     FROM users WHERE email = $1`,
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

  const { accessToken, rawRefreshToken } = await createTokensForUser(user);

  return {
    user: mapUserRowToDTO(user),
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: 900 // 15 minutes
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthSessionResponse> {
  const existing = await query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing.rows.length > 0) {
    throw AppError.validation('An account with this email address already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const fallbackName = input.name || input.email.split('@')[0];

  const insertResult = await query(
    `INSERT INTO users (email, password_hash, name, role, onboarding_completed, auth_provider)
     VALUES ($1, $2, $3, 'PATIENT', FALSE, 'LOCAL')
     RETURNING id, email, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider`,
    [input.email, passwordHash, fallbackName]
  );

  const newUser = insertResult.rows[0];
  const { accessToken, rawRefreshToken } = await createTokensForUser(newUser);

  return {
    user: mapUserRowToDTO(newUser),
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: 900
  };
}

export async function googleAuthUser(input: GoogleAuthInput): Promise<AuthSessionResponse> {
  const existing = await query(
    `SELECT id, email, password_hash, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider
     FROM users WHERE email = $1`,
    [input.email]
  );

  let user = existing.rows[0];

  if (!user) {
    // Generate secure random hash for accounts created via Google OAuth
    const randomSecret = crypto.randomBytes(32).toString('hex');
    const dummyPasswordHash = await bcrypt.hash(randomSecret, 10);

    const insertResult = await query(
      `INSERT INTO users (email, password_hash, name, role, onboarding_completed, auth_provider)
       VALUES ($1, $2, $3, 'PATIENT', FALSE, 'GOOGLE')
       RETURNING id, email, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider`,
      [input.email, dummyPasswordHash, input.name]
    );
    user = insertResult.rows[0];
  }

  const { accessToken, rawRefreshToken } = await createTokensForUser(user);

  return {
    user: mapUserRowToDTO(user),
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: 900
  };
}

export async function getCurrentUser(userId: string): Promise<UserProfileDTO> {
  const result = await query(
    `SELECT id, email, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider
     FROM users WHERE id = $1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    throw AppError.notFound('User not found');
  }

  return mapUserRowToDTO(user);
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
