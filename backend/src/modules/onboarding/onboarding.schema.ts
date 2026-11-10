import { z } from 'zod';

// Phone format: Optional '+' prefix followed by 10 to 15 digits
const phoneRegex = /^\+?[0-9]{10,15}$/;

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number (10 to 15 digits with optional country code)')
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number'),
  otp: z
    .string()
    .trim()
    .min(4, 'OTP must be at least 4 digits')
    .max(6, 'OTP cannot exceed 6 digits')
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  dob: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, 'Date of Birth must be a valid past date'),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(150, 'Location cannot exceed 150 characters')
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

