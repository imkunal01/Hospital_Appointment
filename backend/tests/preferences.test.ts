import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/config/db.js';
import { signAccessToken } from '../src/utils/token.js';

describe('Preferences Module Integration Tests', () => {
  let querySpy: jest.SpyInstance;
  const userId = 'a1111111-1111-1111-1111-111111111111';
  let token: string;

  beforeAll(() => {
    token = signAccessToken({
      userId,
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

  describe('GET /me/preferences', () => {
    it('returns user reminder preferences', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [{ enabled: true, hours_before: 24 }],
        rowCount: 1
      } as any);

      const res = await request(app)
        .get('/me/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        enabled: true,
        hoursBefore: 24
      });
    });

    it('returns 401 UNAUTHORIZED when no token is supplied', async () => {
      const res = await request(app).get('/me/preferences');
      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('PUT /me/preferences', () => {
    it('successfully updates preferences with valid values', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [{ enabled: false, hours_before: 12 }],
        rowCount: 1
      } as any);

      const res = await request(app)
        .put('/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: false,
          hoursBefore: 12
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        enabled: false,
        hoursBefore: 12
      });
    });

    it('returns 400 VALIDATION_ERROR when hoursBefore is out of valid range (1-72)', async () => {
      const res = await request(app)
        .put('/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: true,
          hoursBefore: 100 // invalid: > 72
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when hoursBefore is 0', async () => {
      const res = await request(app)
        .put('/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: true,
          hoursBefore: 0 // invalid: < 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
