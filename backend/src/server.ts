import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkDbConnection, pool } from './config/db.js';

const server = app.listen(env.PORT, async () => {
  console.log(`[hospital-appointment-backend] Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`, {
    port: env.PORT,
    environment: env.NODE_ENV
  });

  // Database health check running at the very start of server
  try {
    const dbHealth = await checkDbConnection();
    if (dbHealth.ok) {
      console.log(`[hospital-appointment-backend] Database health check: OK (${dbHealth.latencyMs}ms)`);
      logger.info('Database health check passed at startup', {
        status: 'healthy',
        connected: true,
        latencyMs: dbHealth.latencyMs
      });
    } else {
      console.error(`[hospital-appointment-backend] Database health check: FAILED - ${dbHealth.error}`);
      logger.error('Database health check failed at startup', undefined, {
        status: 'unhealthy',
        connected: false,
        error: dbHealth.error
      });
    }
  } catch (err: any) {
    console.error(`[hospital-appointment-backend] Database health check exception: ${err?.message || err}`);
    logger.error('Database health check exception at startup', err, {
      connected: false
    });
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    try {
      await pool.end();
    } catch {
      // Ignore if pool already closed
    }
    console.log('HTTP server closed');
    logger.info('HTTP server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    try {
      await pool.end();
    } catch {
      // Ignore if pool already closed
    }
    console.log('HTTP server closed');
    logger.info('HTTP server closed successfully');
    process.exit(0);
  });
});
