import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/config/db.js';
import { signAccessToken } from '../src/utils/token.js';

describe('Catalog Module Integration Tests', () => {
  let querySpy: jest.SpyInstance;
  let validPatientToken: string;

  beforeAll(() => {
    validPatientToken = signAccessToken({
      userId: 'a1111111-1111-1111-1111-111111111111',
      email: 'patient1@example.test',
      role: 'PATIENT'
    });
  });

  beforeEach(() => {
    querySpy = jest.spyOn(db, 'query');
  });

  afterEach(() => {
    querySpy.mockRestore();
  });

  describe('Authentication Gates', () => {
    it('returns 401 UNAUTHORIZED when no token is supplied to /departments', async () => {
      const res = await request(app).get('/departments');
      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('returns 401 UNAUTHORIZED when no token is supplied to /doctors', async () => {
      const res = await request(app).get('/doctors');
      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('returns 401 UNAUTHORIZED when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/departments')
        .set('Authorization', 'Bearer invalid_signature_token');

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /departments', () => {
    it('returns a list of departments with expected fields', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [
          { id: 'd1111111-1111-1111-1111-111111111111', name: 'Cardiology' },
          { id: 'd2222222-2222-2222-2222-222222222222', name: 'Orthopedics' }
        ],
        rowCount: 2
      } as any);

      const res = await request(app)
        .get('/departments')
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toEqual({
        id: 'd1111111-1111-1111-1111-111111111111',
        name: 'Cardiology'
      });
    });
  });

  describe('GET /doctors', () => {
    it('returns a list of all doctors', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [
          {
            id: 'c1111111-1111-1111-1111-111111111111',
            department_id: 'd1111111-1111-1111-1111-111111111111',
            department_name: 'Cardiology',
            name: 'Dr. Sarah Mitchell',
            specialty: 'Interventional Cardiology',
            bio: 'Heart specialist'
          }
        ],
        rowCount: 1
      } as any);

      const res = await request(app)
        .get('/doctors')
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toEqual({
        id: 'c1111111-1111-1111-1111-111111111111',
        departmentId: 'd1111111-1111-1111-1111-111111111111',
        departmentName: 'Cardiology',
        name: 'Dr. Sarah Mitchell',
        specialty: 'Interventional Cardiology',
        bio: 'Heart specialist'
      });
    });

    it('filters doctors by departmentId when provided', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);

      const deptId = 'd1111111-1111-1111-1111-111111111111';
      const res = await request(app)
        .get(`/doctors?departmentId=${deptId}`)
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(200);
      expect(querySpy).toHaveBeenCalledWith(
        expect.stringContaining('WHERE d.department_id = $1'),
        [deptId]
      );
    });

    it('returns 400 VALIDATION_ERROR if departmentId query param is not a valid UUID', async () => {
      const res = await request(app)
        .get('/doctors?departmentId=invalid-uuid-string')
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /doctors/:id/slots', () => {
    const doctorId = 'c1111111-1111-1111-1111-111111111111';

    it('returns slots for a doctor on a given date', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('FROM doctors WHERE id = $1')) {
          return { rows: [{ id: doctorId }], rowCount: 1 } as any;
        }
        if (text.includes('FROM slots')) {
          return {
            rows: [
              {
                id: 'e1111111-1111-1111-1111-111111111111',
                doctor_id: doctorId,
                starts_at: new Date('2026-11-08T09:00:00.000Z'),
                ends_at: new Date('2026-11-08T09:45:00.000Z'),
                status: 'AVAILABLE'
              }
            ],
            rowCount: 1
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .get(`/doctors/${doctorId}/slots?date=2026-11-08`)
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toEqual({
        id: 'e1111111-1111-1111-1111-111111111111',
        doctorId: doctorId,
        startsAt: '2026-11-08T09:00:00.000Z',
        endsAt: '2026-11-08T09:45:00.000Z',
        status: 'AVAILABLE'
      });
    });

    it('returns 404 NOT_FOUND if doctor does not exist', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .get(`/doctors/${doctorId}/slots?date=2026-11-08`)
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('returns 400 VALIDATION_ERROR if date format is invalid', async () => {
      const res = await request(app)
        .get(`/doctors/${doctorId}/slots?date=08-11-2026`) // not YYYY-MM-DD
        .set('Authorization', `Bearer ${validPatientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
