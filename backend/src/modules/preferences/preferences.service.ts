import { query } from '../../config/db.js';
import { UpdatePreferencesInput } from './preferences.schema.js';

export interface ReminderPreferencesRecord {
  enabled: boolean;
  hoursBefore: number;
}

export async function getUserPreferences(userId: string): Promise<ReminderPreferencesRecord> {
  const result = await query(
    'SELECT enabled, hours_before FROM reminder_preferences WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    // Default fallback if row does not exist yet
    return {
      enabled: true,
      hoursBefore: 24
    };
  }

  return {
    enabled: result.rows[0].enabled,
    hoursBefore: result.rows[0].hours_before
  };
}

export async function updateUserPreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<ReminderPreferencesRecord> {
  const result = await query(
    `INSERT INTO reminder_preferences (user_id, enabled, hours_before, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       enabled = EXCLUDED.enabled,
       hours_before = EXCLUDED.hours_before,
       updated_at = NOW()
     RETURNING enabled, hours_before`,
    [userId, input.enabled, input.hoursBefore]
  );

  return {
    enabled: result.rows[0].enabled,
    hoursBefore: result.rows[0].hours_before
  };
}

