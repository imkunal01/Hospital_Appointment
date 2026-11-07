import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { departmentsRouter, doctorsRouter } from './modules/catalog/catalog.routes.js';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true
  })
);
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

// 404 Catch-All Route
app.use((req: Request, _res: Response, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// Central Error Handler
app.use(errorHandler);
