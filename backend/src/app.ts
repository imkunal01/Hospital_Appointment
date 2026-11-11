import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestCorrelation, requestLogger } from './middleware/requestLogger.js';
import { AppError } from './utils/AppError.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { departmentsRouter, doctorsRouter } from './modules/catalog/catalog.routes.js';
import { appointmentsRouter } from './modules/appointments/appointments.routes.js';
import { preferencesRouter } from './modules/preferences/preferences.routes.js';
import { onboardingRouter } from './modules/onboarding/onboarding.routes.js';

export const app = express();

// Trust reverse proxy (Render, Cloudflare, AWS ALB) for accurate client IP and protocol detection
app.set('trust proxy', 1);

// Request Correlation ID (Assigns unique req.id and sets X-Request-ID response header)
app.use(requestCorrelation);

// Structured HTTP Request Logging (Single unified logger via Winston)
app.use(requestLogger);

// Security headers
app.use(helmet());

// Production-ready CORS configuration:
// - Supports wildcard '*'
// - Supports comma-separated origins (e.g. 'https://medibook.onrender.com,http://localhost:8081')
// - Allows requests without an Origin header (mobile apps native network stack, curl, server-to-server)
const rawOrigin = env.CORS_ORIGIN?.trim() || '*';
const allowedOrigins = rawOrigin === '*' ? '*' : rawOrigin.split(',').map((o) => o.trim());

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin || allowedOrigins === '*') {
      return callback(null, true);
    }
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'Idempotency-Key']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// Health Check Endpoint (Public)
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDbConnection();

  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'healthy' : 'degraded',
    service: 'hospital-appointment-backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.ok,
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error ? { error: 'Database connection failed' } : {})
    }
  });
});

// Domain Routes
app.use('/auth', authRouter);
app.use('/departments', departmentsRouter);
app.use('/doctors', doctorsRouter);
app.use('/appointments', appointmentsRouter);
app.use('/me/preferences', preferencesRouter);
app.use('/onboarding', onboardingRouter);

// 404 Catch-All Route
app.use((req: Request, _res: Response, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// Central Error Handler
app.use(errorHandler);
