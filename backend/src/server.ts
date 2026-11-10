import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  console.log(`[hospital-appointment-backend] Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`, {
    port: env.PORT,
    environment: env.NODE_ENV
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    logger.info('HTTP server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    logger.info('HTTP server closed successfully');
    process.exit(0);
  });
});

