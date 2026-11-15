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

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  dob: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, 'Date of Birth must be a valid past date')
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number (10 to 15 digits)')
    .optional()
    .nullable(),
  location: z.string().trim().max(150).optional().nullable()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

