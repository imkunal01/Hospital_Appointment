import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional()
});

export const googleAuthSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  googleId: z.string().min(1, 'Google ID is required').optional()
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Invalid refresh token format')
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20, 'Invalid refresh token format')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;

