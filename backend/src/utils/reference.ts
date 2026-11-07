import crypto from 'crypto';

/**
 * Generate a unique, human-readable appointment reference.
 * Format: HA-YYYYMMDD-XXXX (e.g. HA-20261108-A93F)
 */
export function generateAppointmentReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `HA-${dateStr}-${randomSuffix}`;
}
