import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID UUID format')
});

export const rescheduleAppointmentSchema = z.object({
  newSlotId: z.string().uuid('Invalid new slot ID UUID format')
});

export const appointmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid appointment ID UUID format')
});

export const listAppointmentsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past']).default('upcoming')
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type AppointmentIdParam = z.infer<typeof appointmentIdParamSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

