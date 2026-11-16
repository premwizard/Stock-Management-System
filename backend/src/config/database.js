import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: env.DB_MAX_CONNECTIONS,
      idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: env.DB_MAX_CONNECTIONS,
      idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS
    };

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.debug('New PostgreSQL client connected to pool');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

/**
 * Execute parameterized query using the pool
 * @param {string} text - SQL query string
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Acquire a dedicated client from the pool (for database transactions)
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = () => pool.connect();

/**
 * Check database connectivity and roundtrip latency
 * @returns {Promise<{ status: string, latencyMs: number }>}
 */
export const checkDatabaseConnection = async () => {
  const start = Date.now();
  const res = await pool.query('SELECT 1 AS health_check');
  const latencyMs = Date.now() - start;
  return {
    status: res.rows[0]?.health_check === 1 ? 'connected' : 'degraded',
    latencyMs
  };
};
