import app from './app.js';
import { env } from './config/env.js';
import { pool, checkDatabaseConnection } from './config/database.js';
import { runMigrations } from './database/migrate.js';
import { runSeed } from './database/seed.js';
import { logger } from './utils/logger.js';

let server;
let dbInitialized = false;

const initializeDatabase = async () => {
  try {
    logger.info('Checking PostgreSQL connection...');
    const dbHealth = await checkDatabaseConnection();
    logger.info(`PostgreSQL connected successfully (Latency: ${dbHealth.latencyMs}ms)`);

    logger.info('Executing database schema migrations...');
    await runMigrations();

    // Auto-seed if database is fresh (0 categories)
    const catCheck = await pool.query('SELECT COUNT(*)::int AS count FROM categories');
    if (catCheck.rows[0]?.count === 0) {
      logger.info('Fresh database detected. Seeding initial automotive catalogue...');
      await runSeed();
    }

    dbInitialized = true;
    logger.info('Database schema and initial data verified successfully.');
  } catch (err) {
    logger.error(
      {
        message: err.message,
        code: err.code,
        host: env.DB_HOST,
        port: env.DB_PORT,
        hasDatabaseUrl: Boolean(env.DATABASE_URL)
      },
      'PostgreSQL connection could not be established on startup. ' +
        'If running on Render, make sure to add DATABASE_URL (from your Render PostgreSQL or Supabase/Neon instance) ' +
        'in the Environment Variables tab of your Render Web Service.'
    );
  }
};

const startServer = async () => {
  try {
    // 1. Bind and listen on HTTP PORT immediately so Render health checks succeed
    server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} in [${env.NODE_ENV}] mode`);
      logger.info(`Health check available at ${env.API_PREFIX}/health`);
    });

    // 2. Initialize database connection and migrations
    await initializeDatabase();

    // 3. If database failed on initial boot, attempt automatic background reconnect
    if (!dbInitialized) {
      const retryInterval = setInterval(async () => {
        try {
          const health = await checkDatabaseConnection();
          if (health.status === 'connected') {
            logger.info('PostgreSQL connected on retry attempt!');
            clearInterval(retryInterval);
            await initializeDatabase();
          }
        } catch {
          // Keep waiting for DB environment to be configured or provisioned
        }
      }, 10000);
      retryInterval.unref();
    }
  } catch (err) {
    logger.error({ err }, 'Failed to bind HTTP server port');
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
