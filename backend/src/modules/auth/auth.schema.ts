import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Invalid refresh token format')
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20, 'Invalid refresh token format')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
