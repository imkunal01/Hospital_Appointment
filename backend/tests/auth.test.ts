import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import * as db from '../src/config/db.js';
import { signAccessToken, hashToken } from '../src/utils/token.js';

// Pre-computed hash for 'Password123!'
const TEST_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

describe('Auth Module Integration Tests', () => {
  let querySpy: jest.SpyInstance;

  beforeEach(() => {
    querySpy = jest.spyOn(db, 'query');
  });

  afterEach(() => {
    querySpy.mockRestore();
  });

  describe('POST /auth/login', () => {
    it('returns access and refresh tokens on valid credentials', async () => {
      // Mock user lookup
      querySpy.mockImplementation(async (text: string, params?: any[]) => {
        if (text.includes('FROM users WHERE email = $1')) {
          return {
            rows: [
              {
                id: 'a1111111-1111-1111-1111-111111111111',
                email: 'patient1@example.test',
                password_hash: TEST_PASSWORD_HASH,
                name: 'John Doe',
                role: 'PATIENT'
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
        .post('/auth/login')
        .send({
          email: 'patient1@example.test',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.expiresIn).toBe(900);
      expect(res.body.user).toEqual({
        id: 'a1111111-1111-1111-1111-111111111111',
        email: 'patient1@example.test',
        name: 'John Doe',
        role: 'PATIENT'
      });
    });

    it('returns 401 UNAUTHORIZED when password is wrong', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [
          {
            id: 'a1111111-1111-1111-1111-111111111111',
            email: 'patient1@example.test',
            password_hash: TEST_PASSWORD_HASH,
            name: 'John Doe',
            role: 'PATIENT'
          }
        ],
        rowCount: 1
      } as any);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'patient1@example.test',
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns 401 UNAUTHORIZED when user is not found', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.test',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('returns 400 VALIDATION_ERROR on malformed request body', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new access token with valid refresh token', async () => {
      const rawRefreshToken = 'valid_test_refresh_token_string_12345';
      const tokenHash = hashToken(rawRefreshToken);

      querySpy.mockResolvedValueOnce({
        rows: [
          {
            id: 'rt-1',
            user_id: 'a1111111-1111-1111-1111-111111111111',
            expires_at: new Date(Date.now() + 1000000),
            revoked_at: null,
            email: 'patient1@example.test',
            role: 'PATIENT'
          }
        ],
        rowCount: 1
      } as any);

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.expiresIn).toBe(900);
    });

    it('returns 401 UNAUTHORIZED for revoked or invalid refresh token', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_or_revoked_token_example_12345' });

      expect(res.status).toBe(401);
      expect(res.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('POST /auth/logout', () => {
    it('successfully revokes the provided refresh token', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'active_refresh_token_string_to_revoke_123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Successfully logged out'
      });
    });
  });
});

