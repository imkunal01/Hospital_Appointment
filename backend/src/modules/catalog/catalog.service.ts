import { query } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';

export interface DepartmentItem {
  id: string;
  name: string;
}

export interface DoctorItem {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  specialty: string;
  bio: string | null;
}

export interface SlotItem {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: 'AVAILABLE' | 'BOOKED';
}

export async function listDepartments(): Promise<DepartmentItem[]> {
  const result = await query(
    'SELECT id, name FROM departments ORDER BY name ASC'
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name
  }));
}

export async function listDoctors(departmentId?: string): Promise<DoctorItem[]> {
  let sql = `
    SELECT 
      d.id, 
      d.name, 
      d.specialty, 
      d.bio, 
      d.department_id, 
      dept.name AS department_name
    FROM doctors d
    JOIN departments dept ON d.department_id = dept.id
  `;
  const params: any[] = [];

  if (departmentId) {
    sql += ' WHERE d.department_id = $1';
    params.push(departmentId);
  }

  sql += ' ORDER BY d.name ASC';

  const result = await query(sql, params);

  return result.rows.map((row) => ({
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    name: row.name,
    specialty: row.specialty,
    bio: row.bio
  }));
}

export async function listDoctorSlots(doctorId: string, dateStr: string): Promise<SlotItem[]> {
  // Check doctor exists
  const doctorCheck = await query('SELECT id FROM doctors WHERE id = $1', [doctorId]);
  if (doctorCheck.rows.length === 0) {
    throw AppError.notFound('Doctor not found');
  }

  // Define date window in UTC
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const result = await query(
    `SELECT id, doctor_id, starts_at, ends_at, status
     FROM slots
     WHERE doctor_id = $1
       AND status = 'AVAILABLE'
       AND starts_at >= $2
       AND starts_at <= $3
     ORDER BY starts_at ASC`,
    [doctorId, startOfDay, endOfDay]
  );

  return result.rows.map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    startsAt: row.starts_at.toISOString ? row.starts_at.toISOString() : new Date(row.starts_at).toISOString(),
    endsAt: row.ends_at.toISOString ? row.ends_at.toISOString() : new Date(row.ends_at).toISOString(),
    status: row.status
  }));
}
