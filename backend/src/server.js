import app from './app.js';
import { env } from './config/env.js';
import { pool, checkDatabaseConnection } from './config/database.js';
import { logger } from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    // Verify database connectivity
    logger.info('Checking PostgreSQL connection...');
    const dbHealth = await checkDatabaseConnection();
    logger.info(`PostgreSQL connected successfully (Latency: ${dbHealth.latencyMs}ms)`);

    server = app.listen(env.PORT, () => {
      logger.info(`Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
      logger.info(`Health check available at http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server due to database or initialization error');
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
    });
  }

  try {
    await pool.end();
    logger.info('PostgreSQL connection pool closed.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during pool termination');
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  process.exit(1);
});

startServer();

