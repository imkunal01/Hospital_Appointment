import { query, withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { generateAppointmentReference } from '../../utils/reference.js';

export interface AppointmentRecord {
  id: string;
  reference: string;
  patientId: string;
  slotId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startsAt: string;
  endsAt: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  departmentId: string;
  departmentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitReportMetadata {
  id: string;
  appointmentId: string;
  title: string;
  reportType: string;
  reportDate: string;
  fileSizeKb: number;
}

/**
 * Format a raw appointment database row with joins into the standardized AppointmentRecord.
 */
function mapAppointmentRow(row: any): AppointmentRecord {
  return {
    id: row.id,
    reference: row.reference,
    patientId: row.patient_id,
    slotId: row.slot_id,
    status: row.status,
    startsAt: row.starts_at instanceof Date ? row.starts_at.toISOString() : new Date(row.starts_at).toISOString(),
    endsAt: row.ends_at instanceof Date ? row.ends_at.toISOString() : new Date(row.ends_at).toISOString(),
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    specialty: row.specialty,
    departmentId: row.department_id,
    departmentName: row.department_name,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()
  };
}

/**
 * Query appointment by ID joined with slot, doctor, and department.
 * Always scoped to the authenticated patient.
 */
async function getAppointmentJoined(patientId: string, appointmentId: string, executor = query) {
  const result = await executor(
    `SELECT 
       a.id, a.reference, a.patient_id, a.slot_id, a.status, a.created_at, a.updated_at,
       s.starts_at, s.ends_at, s.doctor_id,
       d.name AS doctor_name, d.specialty, d.department_id,
       dept.name AS department_name
     FROM appointments a
     JOIN slots s ON a.slot_id = s.id
     JOIN doctors d ON s.doctor_id = d.id
     JOIN departments dept ON d.department_id = dept.id
     WHERE a.id = $1 AND a.patient_id = $2`,
    [appointmentId, patientId]
  );
  return result.rows[0] ? mapAppointmentRow(result.rows[0]) : null;
}

/**
 * Book an appointment atomically.
 * Idempotency check -> Verify slot time -> Atomic UPDATE slots -> INSERT appointment.
 */
export async function bookAppointment(
  patientId: string,
  slotId: string,
  idempotencyKey?: string
): Promise<{ appointment: AppointmentRecord; isExisting: boolean }> {
  // 1. Idempotency Check: return existing appointment if key already used for this patient
  if (idempotencyKey) {
    const existingResult = await query(
      `SELECT 
         a.id, a.reference, a.patient_id, a.slot_id, a.status, a.created_at, a.updated_at,
         s.starts_at, s.ends_at, s.doctor_id,
         d.name AS doctor_name, d.specialty, d.department_id,
         dept.name AS department_name
       FROM appointments a
       JOIN slots s ON a.slot_id = s.id
       JOIN doctors d ON s.doctor_id = d.id
       JOIN departments dept ON d.department_id = dept.id
       WHERE a.idempotency_key = $1 AND a.patient_id = $2`,
      [idempotencyKey, patientId]
    );

    if (existingResult.rows.length > 0) {
      return {
        appointment: mapAppointmentRow(existingResult.rows[0]),
        isExisting: true
      };
    }
  }

  // 2. Validate that slot exists and is not in the past
  const slotCheck = await query(
    'SELECT id, starts_at, status FROM slots WHERE id = $1',
    [slotId]
  );

  const slot = slotCheck.rows[0];
  if (!slot) {
    throw AppError.notFound('Selected appointment slot not found');
  }

  const slotStart = new Date(slot.starts_at);
  if (slotStart <= new Date()) {
    throw AppError.badRequest('Cannot book an appointment slot in the past');
  }

  // 3. Atomic Database Transaction
  const appointment = await withTransaction(async (client) => {
    // Atomic slot lock & status update
    const slotUpdate = await client.query(
      `UPDATE slots 
       SET status = 'BOOKED' 
       WHERE id = $1 AND status = 'AVAILABLE'`,
      [slotId]
    );

    if (slotUpdate.rowCount === 0) {
      throw AppError.slotTaken('Selected appointment slot is no longer available');
    }

    const reference = generateAppointmentReference();

    const insertResult = await client.query(
      `INSERT INTO appointments (reference, patient_id, slot_id, status, idempotency_key)
       VALUES ($1, $2, $3, 'CONFIRMED', $4)
       RETURNING id`,
      [reference, patientId, slotId, idempotencyKey || null]
    );

    const newAppointmentId = insertResult.rows[0].id;
    const fullRecord = await getAppointmentJoined(patientId, newAppointmentId, (t, p) => client.query(t, p));
    return fullRecord!;
  });

  return { appointment, isExisting: false };
}

/**
 * List appointments scoped to patient, filtered by scope (upcoming vs past).
 */
export async function listAppointments(
  patientId: string,
  scope: 'upcoming' | 'past'
): Promise<AppointmentRecord[]> {
  let sql = `
    SELECT 
      a.id, a.reference, a.patient_id, a.slot_id, a.status, a.created_at, a.updated_at,
      s.starts_at, s.ends_at, s.doctor_id,
      d.name AS doctor_name, d.specialty, d.department_id,
      dept.name AS department_name
    FROM appointments a
    JOIN slots s ON a.slot_id = s.id
    JOIN doctors d ON s.doctor_id = d.id
    JOIN departments dept ON d.department_id = dept.id
    WHERE a.patient_id = $1
  `;

  if (scope === 'upcoming') {
    sql += ` AND a.status = 'CONFIRMED' AND s.starts_at >= NOW()
             ORDER BY s.starts_at ASC`;
  } else {
    sql += ` AND (a.status IN ('CANCELLED', 'COMPLETED') OR (a.status = 'CONFIRMED' AND s.starts_at < NOW()))
             ORDER BY s.starts_at DESC`;
  }

  const result = await query(sql, [patientId]);
  return result.rows.map(mapAppointmentRow);
}

/**
 * Get appointment detail by ID. Returns 404 for other patients' appointments.
 */
export async function getAppointmentById(
  patientId: string,
  appointmentId: string
): Promise<AppointmentRecord> {
  const appointment = await getAppointmentJoined(patientId, appointmentId);
  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }
  return appointment;
}

/**
 * Atomically reschedule an appointment to a new slot.
 * If new slot is taken, throws 409 and leaves original appointment & slot unchanged.
 */
export async function rescheduleAppointment(
  patientId: string,
  appointmentId: string,
  newSlotId: string
): Promise<AppointmentRecord> {
  const current = await getAppointmentJoined(patientId, appointmentId);
  if (!current) {
    throw AppError.notFound('Appointment not found');
  }

  if (current.status !== 'CONFIRMED') {
    throw AppError.badRequest(`Cannot reschedule an appointment with status ${current.status}`);
  }

  if (current.slotId === newSlotId) {
    throw AppError.badRequest('Cannot reschedule to the same slot');
  }

  // Validate new slot
  const newSlotCheck = await query(
    'SELECT id, starts_at, status FROM slots WHERE id = $1',
    [newSlotId]
  );
  const newSlot = newSlotCheck.rows[0];
  if (!newSlot) {
    throw AppError.notFound('Target appointment slot not found');
  }

  if (new Date(newSlot.starts_at) <= new Date()) {
    throw AppError.badRequest('Cannot reschedule to a slot in the past');
  }

  return withTransaction(async (client) => {
    // 1. Try to claim new slot
    const claimResult = await client.query(
      `UPDATE slots 
       SET status = 'BOOKED' 
       WHERE id = $1 AND status = 'AVAILABLE'`,
      [newSlotId]
    );

    if (claimResult.rowCount === 0) {
      throw AppError.slotTaken('The requested slot is already taken');
    }

    // 2. Release previous slot
    await client.query(
      `UPDATE slots SET status = 'AVAILABLE' WHERE id = $1`,
      [current.slotId]
    );

    // 3. Update appointment with new slot
    await client.query(
      `UPDATE appointments 
       SET slot_id = $1, updated_at = NOW() 
       WHERE id = $2 AND patient_id = $3`,
      [newSlotId, appointmentId, patientId]
    );

    const updated = await getAppointmentJoined(patientId, appointmentId, (t, p) => client.query(t, p));
    return updated!;
  });
}

/**
 * Cancel an appointment and release its slot.
 * Idempotent: If already cancelled, safely returns current state.
 */
export async function cancelAppointment(
  patientId: string,
  appointmentId: string
): Promise<{ appointment: AppointmentRecord; message: string }> {
  const current = await getAppointmentJoined(patientId, appointmentId);
  if (!current) {
    throw AppError.notFound('Appointment not found');
  }

  if (current.status === 'CANCELLED') {
    return {
      appointment: current,
      message: 'Appointment is already cancelled'
    };
  }

  if (current.status === 'COMPLETED') {
    throw AppError.badRequest('Cannot cancel an appointment that has already been completed');
  }

  const updatedAppointment = await withTransaction(async (client) => {
    // Free slot
    await client.query(
      `UPDATE slots SET status = 'AVAILABLE' WHERE id = $1`,
      [current.slotId]
    );

    // Update appointment status
    await client.query(
      `UPDATE appointments 
       SET status = 'CANCELLED', updated_at = NOW() 
       WHERE id = $1 AND patient_id = $2`,
      [appointmentId, patientId]
    );

    const updated = await getAppointmentJoined(patientId, appointmentId, (t, p) => client.query(t, p));
    return updated!;
  });

  return {
    appointment: updatedAppointment,
    message: 'Appointment successfully cancelled'
  };
}

/**
 * Retrieve visit reports for an appointment.
 * STRICTLY METADATA ONLY: no diagnostic or treatment recommendations.
 */
export async function getAppointmentReports(
  patientId: string,
  appointmentId: string
): Promise<VisitReportMetadata[]> {
  // Confirm appointment ownership
  const appointment = await getAppointmentJoined(patientId, appointmentId);
  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  const result = await query(
    `SELECT id, appointment_id, title, report_type, report_date, file_size_kb
     FROM visit_reports
     WHERE appointment_id = $1
     ORDER BY report_date DESC`,
    [appointmentId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    title: row.title,
    reportType: row.report_type,
    reportDate: row.report_date instanceof Date ? row.report_date.toISOString().slice(0, 10) : String(row.report_date).slice(0, 10),
    fileSizeKb: row.file_size_kb
  }));
}

