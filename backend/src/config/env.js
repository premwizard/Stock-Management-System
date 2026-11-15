import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('root'),
  DB_NAME: z.string().default('inventory_db'),
  DB_SSL: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  DB_MAX_CONNECTIONS: z.coerce.number().default(20),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().default(2000),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

