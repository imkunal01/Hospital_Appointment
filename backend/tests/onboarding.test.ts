import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import * as db from '../src/config/db.js';
import { signAccessToken } from '../src/utils/token.js';

const TEST_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

describe('Onboarding & Multi-Method Auth Integration Tests', () => {
  let querySpy: jest.SpyInstance;

  const testUserId = 'u1111111-1111-1111-1111-111111111111';
  const testPatientToken = signAccessToken({
    userId: testUserId,
    email: 'newpatient@example.test',
    role: 'PATIENT'
  });

  beforeEach(() => {
    querySpy = jest.spyOn(db, 'query');
  });

  afterEach(() => {
    querySpy.mockRestore();
  });

  describe('POST /auth/register', () => {
    it('creates a new patient account with onboardingCompleted: false', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id FROM users WHERE email = $1')) {
          return { rows: [], rowCount: 0 } as any; // No duplicate
        }
        if (text.includes('INSERT INTO users')) {
          return {
            rows: [
              {
                id: testUserId,
                email: 'newpatient@example.test',
                name: 'New Patient',
                role: 'PATIENT',
                phone: null,
                phone_verified: false,
                dob: null,
                location: null,
                onboarding_completed: false,
                auth_provider: 'LOCAL'
              }
            ],
            rowCount: 1
          } as any;
        }
        if (text.includes('INSERT INTO refresh_tokens')) {
          return { rows: [], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'newpatient@example.test',
          password: 'Password123!',
          name: 'New Patient'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toEqual(
        expect.objectContaining({
          email: 'newpatient@example.test',
          onboardingCompleted: false,
          authProvider: 'LOCAL'
        })
      );
    });

    it('rejects duplicate email with 400 VALIDATION_ERROR', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id FROM users WHERE email = $1')) {
          return { rows: [{ id: 'existing-id' }], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.test',
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.message).toContain('already exists');
    });
  });

  describe('POST /auth/google', () => {
    it('creates or logs in a Google user with mock OAuth payload', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id, email, password_hash, name, role')) {
          return { rows: [], rowCount: 0 } as any; // First time google user
        }
        if (text.includes('INSERT INTO users')) {
          return {
            rows: [
              {
                id: 'google-user-uuid',
                email: 'googleuser@gmail.com',
                name: 'Google User',
                role: 'PATIENT',
                phone: null,
                phone_verified: false,
                dob: null,
                location: null,
                onboarding_completed: false,
                auth_provider: 'GOOGLE'
              }
            ],
            rowCount: 1
          } as any;
        }
        if (text.includes('INSERT INTO refresh_tokens')) {
          return { rows: [], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/auth/google')
        .send({
          email: 'googleuser@gmail.com',
          name: 'Google User',
          googleId: 'mock-google-id-12345'
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual(
        expect.objectContaining({
          email: 'googleuser@gmail.com',
          name: 'Google User',
          onboardingCompleted: false,
          authProvider: 'GOOGLE'
        })
      );
    });
  });

  describe('POST /onboarding/phone/send-otp', () => {
    it('issues mock OTP when phone number is available', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id FROM users WHERE phone = $1 AND phone_verified = TRUE')) {
          return { rows: [], rowCount: 0 } as any; // Not registered by another verified user
        }
        if (text.includes('INSERT INTO phone_verifications')) {
          return { rows: [], rowCount: 1 } as any;
        }
        if (text.includes('UPDATE users SET phone = $1')) {
          return { rows: [], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/onboarding/phone/send-otp')
        .set('Authorization', `Bearer ${testPatientToken}`)
        .send({ phone: '+919988776655' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mockOtp).toBe('123456');
    });

    it('rejects if phone is already verified by another user', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id FROM users WHERE phone = $1 AND phone_verified = TRUE')) {
          return { rows: [{ id: 'other-user-uuid' }], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/onboarding/phone/send-otp')
        .set('Authorization', `Bearer ${testPatientToken}`)
        .send({ phone: '+919988776655' });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.message).toBe('This phone number is already registered to another account');
    });
  });

  describe('POST /onboarding/phone/verify-otp', () => {
    it('marks phone as verified when code is valid', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('FROM phone_verifications')) {
          return {
            rows: [
              {
                id: 'verif-uuid',
                otp_code: '123456',
                expires_at: new Date(Date.now() + 600000)
              }
            ],
            rowCount: 1
          } as any;
        }
        if (text.includes('SELECT id FROM users WHERE phone = $1 AND phone_verified = TRUE')) {
          return { rows: [], rowCount: 0 } as any;
        }
        if (text.includes('UPDATE phone_verifications')) {
          return { rows: [], rowCount: 1 } as any;
        }
        if (text.includes('UPDATE users SET phone = $1, phone_verified = TRUE')) {
          return { rows: [], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .post('/onboarding/phone/verify-otp')
        .set('Authorization', `Bearer ${testPatientToken}`)
        .send({
          phone: '+919988776655',
          otp: '123456'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.phoneVerified).toBe(true);
    });
  });

  describe('PUT /onboarding/profile', () => {
    it('completes onboarding profile with calculated age and location', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id, phone, phone_verified FROM users WHERE id = $1')) {
          return {
            rows: [{ id: testUserId, phone: '+919988776655', phone_verified: true }],
            rowCount: 1
          } as any;
        }
        if (text.includes('UPDATE users')) {
          return {
            rows: [
              {
                id: testUserId,
                email: 'newpatient@example.test',
                name: 'Verified Patient',
                role: 'PATIENT',
                phone: '+919988776655',
                phone_verified: true,
                dob: new Date('1996-06-15'),
                location: 'Mumbai South',
                onboarding_completed: true,
                auth_provider: 'LOCAL'
              }
            ],
            rowCount: 1
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .put('/onboarding/profile')
        .set('Authorization', `Bearer ${testPatientToken}`)
        .send({
          name: 'Verified Patient',
          dob: '1996-06-15',
          location: 'Mumbai South'
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual(
        expect.objectContaining({
          name: 'Verified Patient',
          location: 'Mumbai South',
          onboardingCompleted: true
        })
      );
      expect(res.body.age).toBeGreaterThan(18);
    });

    it('rejects profile update if phone is not yet verified', async () => {
      querySpy.mockImplementation(async (text: string) => {
        if (text.includes('SELECT id, phone, phone_verified FROM users WHERE id = $1')) {
          return {
            rows: [{ id: testUserId, phone: '+919988776655', phone_verified: false }],
            rowCount: 1
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const res = await request(app)
        .put('/onboarding/profile')
        .set('Authorization', `Bearer ${testPatientToken}`)
        .send({
          name: 'Verified Patient',
          dob: '1996-06-15',
          location: 'Mumbai South'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Phone number must be verified');
    });
  });
});
