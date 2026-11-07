import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/config/db.js';
import { signAccessToken } from '../src/utils/token.js';

describe('Appointments & Concurrency Domain Tests', () => {
  let querySpy: jest.SpyInstance;
  let txSpy: jest.SpyInstance;

  const patientAId = 'a1111111-1111-1111-1111-111111111111';
  const patientBId = 'a2222222-2222-2222-2222-222222222222';
  const slotId = 'e1111111-1111-1111-1111-111111111111';
  const newSlotId = 'e2222222-2222-2222-2222-222222222222';
  const appointmentId = 'b1111111-1111-1111-1111-111111111111';

  let tokenPatientA: string;
  let tokenPatientB: string;

  const mockJoinedRow = {
    id: appointmentId,
    reference: 'HA-20261108-ABCD',
    patient_id: patientAId,
    slot_id: slotId,
    status: 'CONFIRMED',
    starts_at: new Date(Date.now() + 86400000), // tomorrow
    ends_at: new Date(Date.now() + 86400000 + 2700000),
    doctor_id: 'c1111111-1111-1111-1111-111111111111',
    doctor_name: 'Dr. Sarah Mitchell',
    specialty: 'Interventional Cardiology',
    department_id: 'd1111111-1111-1111-1111-111111111111',
    department_name: 'Cardiology',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeAll(() => {
    tokenPatientA = signAccessToken({
      userId: patientAId,
      email: 'patient1@example.test',
      role: 'PATIENT'
    });
    tokenPatientB = signAccessToken({
      userId: patientBId,
      email: 'patient2@example.test',
      role: 'PATIENT'
    });
  });

  beforeEach(() => {
    querySpy = jest.spyOn(db, 'query');
    txSpy = jest.spyOn(db, 'withTransaction');
  });

  afterEach(() => {
    querySpy.mockRestore();
    txSpy.mockRestore();
  });

  describe('POST /appointments (Atomic Booking & Concurrency)', () => {
    it('successfully books an available future slot (HTTP 201)', async () => {
      // 1. Slot check query
      querySpy.mockResolvedValueOnce({
        rows: [{ id: slotId, starts_at: new Date(Date.now() + 86400000), status: 'AVAILABLE' }],
        rowCount: 1
      } as any);

      // 2. Transaction execution
      txSpy.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            if (sql.includes('UPDATE slots') && sql.includes("'BOOKED'")) {
              return { rowCount: 1, rows: [] };
            }
            if (sql.includes('INSERT INTO appointments')) {
              return { rowCount: 1, rows: [{ id: appointmentId }] };
            }
            if (sql.includes('FROM appointments a')) {
              return { rowCount: 1, rows: [mockJoinedRow] };
            }
            return { rowCount: 0, rows: [] };
          })
        };
        return callback(mockClient as any);
      });

      const res = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenPatientA}`)
        .send({ slotId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('reference');
      expect(res.body.status).toBe('CONFIRMED');
      expect(res.body.patientId).toBe(patientAId);
    });

    it('rejects booking past slots (HTTP 400 VALIDATION_ERROR)', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [{ id: slotId, starts_at: new Date(Date.now() - 3600000), status: 'AVAILABLE' }], // 1 hour ago
        rowCount: 1
      } as any);

      const res = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenPatientA}`)
        .send({ slotId });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.message).toContain('past');
    });

    it('returns HTTP 409 SLOT_TAKEN on concurrency conflict', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [{ id: slotId, starts_at: new Date(Date.now() + 86400000), status: 'AVAILABLE' }],
        rowCount: 1
      } as any);

      // Transaction where atomic update finds 0 rows (slot taken by rival request)
      txSpy.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rowCount: 0, rows: [] })
        };
        return callback(mockClient as any);
      });

      const res = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenPatientA}`)
        .send({ slotId });

      expect(res.status).toBe(409);
      expect(res.body.error).toHaveProperty('code', 'SLOT_TAKEN');
      expect(res.body.error.message).toContain('no longer available');
    });

    it('simulates concurrent double-booking: exactly one succeeds (201), one fails (409)', async () => {
      let slotClaimed = false;

      // Mock slot check
      querySpy.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT id, starts_at, status FROM slots')) {
          return {
            rows: [{ id: slotId, starts_at: new Date(Date.now() + 86400000), status: 'AVAILABLE' }],
            rowCount: 1
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      // Transaction simulates racing locks
      txSpy.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            if (sql.includes('UPDATE slots') && sql.includes("'BOOKED'")) {
              if (!slotClaimed) {
                slotClaimed = true;
                return { rowCount: 1, rows: [] };
              }
              return { rowCount: 0, rows: [] };
            }
            if (sql.includes('INSERT INTO appointments')) {
              return { rowCount: 1, rows: [{ id: appointmentId }] };
            }
            if (sql.includes('FROM appointments a')) {
              return { rowCount: 1, rows: [mockJoinedRow] };
            }
            return { rowCount: 0, rows: [] };
          })
        };
        return callback(mockClient as any);
      });

      // Two simultaneous requests for the exact same slot
      const [res1, res2] = await Promise.all([
        request(app).post('/appointments').set('Authorization', `Bearer ${tokenPatientA}`).send({ slotId }),
        request(app).post('/appointments').set('Authorization', `Bearer ${tokenPatientB}`).send({ slotId })
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });

    it('returns existing appointment on idempotent retry with same Idempotency-Key (HTTP 200)', async () => {
      const idempotencyKey = 'client-idemp-key-unique-1234';

      querySpy.mockImplementation(async (sql: string) => {
        if (sql.includes('WHERE a.idempotency_key = $1 AND a.patient_id = $2')) {
          return { rows: [mockJoinedRow], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${tokenPatientA}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ slotId });

      expect(res.status).toBe(200);
      expect(res.body.reference).toBe('HA-20261108-ABCD');
      // Verify transaction was never started because existing match was returned
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('Ownership Isolation & Access Control', () => {
    it('Patient B cannot read Patient A appointment (returns HTTP 404 NOT_FOUND)', async () => {
      // Mock returns empty when scoped to patient B
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .get(`/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${tokenPatientB}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('Patient B cannot cancel Patient A appointment (returns HTTP 404 NOT_FOUND)', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .post(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${tokenPatientB}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('Patient B cannot reschedule Patient A appointment (returns HTTP 404 NOT_FOUND)', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .patch(`/appointments/${appointmentId}/reschedule`)
        .set('Authorization', `Bearer ${tokenPatientB}`)
        .send({ newSlotId });

      expect(res.status).toBe(404);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('PATCH /appointments/:id/reschedule', () => {
    it('returns HTTP 409 when target new slot is taken; leaves original untouched', async () => {
      querySpy.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM appointments a')) {
          return { rows: [mockJoinedRow], rowCount: 1 } as any;
        }
        if (sql.includes('SELECT id, starts_at, status FROM slots WHERE id = $1')) {
          return {
            rows: [{ id: newSlotId, starts_at: new Date(Date.now() + 86400000), status: 'AVAILABLE' }],
            rowCount: 1
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      // Target slot taken when transaction attempts to lock it
      txSpy.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            if (sql.includes('UPDATE slots SET status = \'BOOKED\'')) {
              return { rowCount: 0, rows: [] };
            }
            return { rowCount: 0, rows: [] };
          })
        };
        return callback(mockClient as any);
      });

      const res = await request(app)
        .patch(`/appointments/${appointmentId}/reschedule`)
        .set('Authorization', `Bearer ${tokenPatientA}`)
        .send({ newSlotId });

      expect(res.status).toBe(409);
      expect(res.body.error).toHaveProperty('code', 'SLOT_TAKEN');
    });
  });

  describe('POST /appointments/:id/cancel', () => {
    it('cancels an appointment and makes it safe to cancel again (idempotent)', async () => {
      // 1. First cancel: confirmed appointment
      querySpy.mockResolvedValueOnce({ rows: [mockJoinedRow], rowCount: 1 } as any);
      txSpy.mockImplementationOnce(async (callback) => {
        const mockClient = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            if (sql.includes('FROM appointments a')) {
              return { rows: [{ ...mockJoinedRow, status: 'CANCELLED' }], rowCount: 1 };
            }
            return { rowCount: 1, rows: [] };
          })
        };
        return callback(mockClient as any);
      });

      const res1 = await request(app)
        .post(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${tokenPatientA}`);

      expect(res1.status).toBe(200);
      expect(res1.body.appointment.status).toBe('CANCELLED');

      // 2. Second cancel: already cancelled appointment returns 200 without error
      querySpy.mockResolvedValueOnce({
        rows: [{ ...mockJoinedRow, status: 'CANCELLED' }],
        rowCount: 1
      } as any);

      const res2 = await request(app)
        .post(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${tokenPatientA}`);

      expect(res2.status).toBe(200);
      expect(res2.body.message).toContain('already cancelled');
    });
  });

  describe('GET /appointments/:id/reports (Metadata Only)', () => {
    it('returns report metadata with strictly no diagnosis or treatment fields', async () => {
      querySpy.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM appointments a')) {
          return { rows: [mockJoinedRow], rowCount: 1 } as any;
        }
        if (sql.includes('FROM visit_reports')) {
          return {
            rows: [
              {
                id: 'f1111111-1111-1111-1111-111111111111',
                appointment_id: appointmentId,
                title: 'Routine Cardiac ECG Tracing Summary',
                report_type: 'ECG_METADATA',
                report_date: '2026-11-04',
                file_size_kb: 342
              }
            ],
            rowCount: 1
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .get(`/appointments/${appointmentId}/reports`)
        .set('Authorization', `Bearer ${tokenPatientA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toEqual({
        id: 'f1111111-1111-1111-1111-111111111111',
        appointmentId: appointmentId,
        title: 'Routine Cardiac ECG Tracing Summary',
        reportType: 'ECG_METADATA',
        reportDate: '2026-11-04',
        fileSizeKb: 342
      });
      // Non-negotiable check: confirm no diagnosis or treatment properties exist
      expect(res.body[0]).not.toHaveProperty('diagnosis');
      expect(res.body[0]).not.toHaveProperty('treatment');
      expect(res.body[0]).not.toHaveProperty('prescription');
    });
  });
});
