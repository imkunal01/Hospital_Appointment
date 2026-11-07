import { z } from 'zod';

export const getDoctorsQuerySchema = z.object({
  departmentId: z.string().uuid('Invalid departmentId UUID format').optional()
});

export const getDoctorSlotsParamsSchema = z.object({
  id: z.string().uuid('Invalid doctor ID UUID format')
});

export const getDoctorSlotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
});

export type GetDoctorsQuery = z.infer<typeof getDoctorsQuerySchema>;
export type GetDoctorSlotsParams = z.infer<typeof getDoctorSlotsParamsSchema>;
export type GetDoctorSlotsQuery = z.infer<typeof getDoctorSlotsQuerySchema>;

