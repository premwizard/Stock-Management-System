import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

let dbAvailable = false;

export const isDatabaseAvailable = () => {
  if (process.env.USE_MOCK_DATA === 'true') return false;
  return dbAvailable;
};

export const setDatabaseAvailable = (status) => {
  dbAvailable = Boolean(status);
};

// Detect whether SSL is required (cloud databases, production, or explicitly enabled)
const isLocalhost =
  (!env.DATABASE_URL && (env.DB_HOST === 'localhost' || env.DB_HOST === '127.0.0.1')) ||
  (env.DATABASE_URL && (env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1')));

const useSsl = env.DB_SSL || (!isLocalhost && (env.NODE_ENV === 'production' || Boolean(env.DATABASE_URL)));

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
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
      ssl: useSsl ? { rejectUnauthorized: false } : false,
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
  try {
    const start = Date.now();
    const res = await pool.query('SELECT 1 AS health_check');
    const latencyMs = Date.now() - start;
    const isConnected = res.rows[0]?.health_check === 1;
    setDatabaseAvailable(isConnected);
    return {
      status: isConnected ? 'connected' : 'degraded',
      latencyMs
    };
  } catch (err) {
    setDatabaseAvailable(false);
    throw err;
  }
};
