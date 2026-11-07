import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  enabled: z.boolean(),
  hoursBefore: z
    .number()
    .int('Hours must be an integer')
    .min(1, 'Hours before must be at least 1')
    .max(72, 'Hours before cannot exceed 72')
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

