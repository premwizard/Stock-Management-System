import { pool, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { runMigrations } from './migrate.js';
import { runSeed } from './seed.js';
import { fileURLToPath } from 'url';

export const resetDatabase = async () => {
  const client = await getClient();
  try {
    logger.warn('RESETTING DATABASE: Dropping all tables...');
    await client.query('BEGIN');

    // Drop tables in correct order
    await client.query(`
      DROP TABLE IF EXISTS stock_movements CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
    `);

    await client.query('COMMIT');
    logger.info('All existing tables dropped.');
    client.release();

    // Run Migrations
    await runMigrations();

    // Run Seed
    const stats = await runSeed();

    logger.info('Database has been completely reset and reseeded successfully.');
    return stats;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    logger.error({ error }, 'Database reset failed.');
    throw error;
  }
};

// Execute if called directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  resetDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.fatal({ err }, 'Reset runner terminated with error');
      await pool.end();
      process.exit(1);
    });
}

