import request from 'supertest';
import { app } from '../src/app.js';
import { logger, redactSensitive, formatError } from '../src/utils/logger.js';
import * as db from '../src/config/db.js';

describe('Backend Logging System Tests', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.spyOn(db, 'checkDbConnection').mockResolvedValue({ ok: true, latencyMs: 5 });
  });

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    logger.setLevel('error'); // reset to test default
  });

  describe('1. PII & Secret Redaction (Non-negotiables)', () => {
    it('redacts passwords, tokens, secrets, and auth headers', () => {
      const sensitiveData = {
        password: 'SuperSecretPassword123!',
        userPassword: 'AnotherPassword',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M',
        refreshToken: 'a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3',
        secret: 'top-secret-value',
        cookie: 'sessionId=abc123xyz'
      };

      const sanitized = redactSensitive(sensitiveData);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.userPassword).toBe('[REDACTED]');
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
    });

    it('redacts patient PII fields (email, phone, name, dob)', () => {
      const piiData = {
        email: 'patient@example.test',
        phone: '+1-555-0199',
        fullName: 'Jane Doe',
        dob: '1985-04-12',
        doctorName: 'Dr. Sarah Mitchell', // Medical provider names are public catalog metadata
        departmentName: 'Cardiology' // Catalog metadata
      };

      const sanitized = redactSensitive(piiData);

      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.phone).toBe('[REDACTED]');
      expect(sanitized.fullName).toBe('[REDACTED]');
      expect(sanitized.dob).toBe('[REDACTED]');
      expect(sanitized.doctorName).toBe('Dr. Sarah Mitchell');
      expect(sanitized.departmentName).toBe('Cardiology');
    });

    it('redacts Bearer token strings and JWT patterns anywhere in strings', () => {
      const tokenData = {
        authHeader: 'Bearer my-secret-raw-token',
        rawJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature'
      };

      const sanitized = redactSensitive(tokenData);

      expect(sanitized.authHeader).toBe('Bearer [REDACTED]');
      expect(sanitized.rawJwt).toBe('[REDACTED_TOKEN]');
    });

    it('handles nested objects, arrays, and circular references gracefully', () => {
      const nested: any = {
        metadata: {
          items: [{ token: 'sensitive-token' }, { safeField: 42 }]
        }
      };
      nested.circular = nested;

      const sanitized = redactSensitive(nested);

      expect(sanitized.metadata.items[0].token).toBe('[REDACTED]');
      expect(sanitized.metadata.items[1].safeField).toBe(42);
      expect(sanitized.circular).toBe('[Circular]');
    });
  });

  describe('2. Log Levels & Filtering', () => {
    it('suppresses debug and info messages when log level is set to warn', () => {
      logger.setLevel('warn');

      logger.debug('This debug message should not be logged');
      logger.info('This info message should not be logged');
      logger.warn('Warning: slot nearing threshold');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      const parsed = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(parsed.level).toBe('WARN');
      expect(parsed.message).toBe('Warning: slot nearing threshold');
    });

    it('emits error logs to console.error with formatted error context', () => {
      logger.setLevel('error');

      const testErr = new Error('Database connection timeout');
      logger.error('Failed to connect to database pool', testErr, { queryAttempt: 3 });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(parsed.level).toBe('ERROR');
      expect(parsed.message).toBe('Failed to connect to database pool');
      expect(parsed.context.queryAttempt).toBe(3);
      expect(parsed.error.message).toBe('Database connection timeout');
      expect(parsed.error.errorType).toBe('Error');
    });
  });

  describe('3. Request Correlation ID & Middleware', () => {
    it('generates a new UUID v4 in X-Request-ID response header if client does not provide one', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      // Valid UUID v4 regex
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('preserves an incoming X-Request-ID supplied by the client for end-to-end tracing', async () => {
      const customId = 'client-trace-id-998877';
      const res = await request(app)
        .get('/health')
        .set('X-Request-ID', customId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customId);
    });

    it('logs request completion on finish with status code, duration, and correlation ID', async () => {
      logger.setLevel('info');

      const traceId = 'req-trace-test-123';
      const res = await request(app)
        .get('/health')
        .set('X-Request-ID', traceId);

      expect(res.status).toBe(200);

      // Note: /health logs at debug level to prevent log pollution, so setting debug:
      logger.setLevel('debug');
      await request(app).get('/health').set('X-Request-ID', traceId);

      expect(consoleLogSpy).toHaveBeenCalled();
      const lastCall = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(lastCall);

      expect(parsed.message).toContain('HTTP GET /health 200');
      expect(parsed.context.requestId).toBe(traceId);
      expect(parsed.context.statusCode).toBe(200);
      expect(typeof parsed.context.durationMs).toBe('number');
    });

    it('logs 404 operational errors at warn level with correlation ID', async () => {
      logger.setLevel('warn');

      const traceId = 'trace-404-test';
      const res = await request(app)
        .get('/api-non-existent-endpoint')
        .set('X-Request-ID', traceId);

      expect(res.status).toBe(404);
      expect(consoleWarnSpy).toHaveBeenCalled();

      const lastCall = consoleWarnSpy.mock.calls[consoleWarnSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(lastCall);

      expect(parsed.level).toBe('WARN');
      expect(parsed.context.requestId).toBe(traceId);
      expect(parsed.context.statusCode).toBe(404);
    });
  });

  describe('4. formatError utility', () => {
    it('extracts errorType, message, and stack from Error objects', () => {
      const err = new TypeError('Invalid argument type');
      const formatted = formatError(err);

      expect(formatted.errorType).toBe('TypeError');
      expect(formatted.message).toBe('Invalid argument type');
      expect(formatted.stack).toBeDefined();
    });

    it('formats primitive error values cleanly', () => {
      const formatted = formatError('String error message');
      expect(formatted.message).toBe('String error message');
    });
  });
});
