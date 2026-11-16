import app from './app.js';
import { env } from './config/env.js';
import { pool, checkDatabaseConnection } from './config/database.js';
import { runMigrations } from './database/migrate.js';
import { runSeed } from './database/seed.js';
import { logger } from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    // Verify database connectivity
    logger.info('Checking PostgreSQL connection...');
    const dbHealth = await checkDatabaseConnection();
    logger.info(`PostgreSQL connected successfully (Latency: ${dbHealth.latencyMs}ms)`);

    // In production or cloud environments, verify and run pending migrations
    try {
      logger.info('Checking database schema migrations...');
      await runMigrations();

      // Auto-seed if database is fresh
      const catCheck = await pool.query('SELECT COUNT(*)::int AS count FROM categories');
      if (catCheck.rows[0]?.count === 0) {
        logger.info('Fresh database detected. Seeding initial automotive catalogue...');
        await runSeed();
      }
    } catch (migErr) {
      logger.warn({ migErr }, 'Migration runner warning during startup');
    }

    server = app.listen(env.PORT, () => {
      logger.info(`Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`Health check available at ${env.API_PREFIX}/health`);
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
