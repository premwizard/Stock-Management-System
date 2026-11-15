import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  const client = await getClient();
  try {
    logger.info('Starting database migrations...');
    await client.query('BEGIN');

    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const alreadyRun = await client.query(
        'SELECT id FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (alreadyRun.rows.length === 0) {
        logger.info(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        logger.info(`Migration applied successfully: ${file}`);
      } else {
        logger.info(`Migration already applied, skipping: ${file}`);
      }
    }

    await client.query('COMMIT');
    logger.info('All migrations completed successfully.');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Migration failed, transaction rolled back.');
    throw error;
  } finally {
    client.release();
  }
};

// Execute if called directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.fatal({ err }, 'Migration runner terminated with error');
      await pool.end();
      process.exit(1);
    });
}

