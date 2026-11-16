import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS Configuration supporting comma-separated origins, wildcards, and tunnels
const configuredOrigins = (env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Always ensure localhost origins are present
if (!configuredOrigins.includes('http://localhost:5173')) configuredOrigins.push('http://localhost:5173');
if (!configuredOrigins.includes('http://127.0.0.1:5173')) configuredOrigins.push('http://127.0.0.1:5173');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');

      if (
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.trycloudflare.com') ||
        env.NODE_ENV === 'development'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Blocked by CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// HTTP Logging Stream via Morgan to Pino
const morganStream = {
  write: (message) => logger.info(message.trim())
};
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined', { stream: morganStream }));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use(env.API_PREFIX, apiRouter);

// Root API metadata route (if accessed directly when frontend is not co-served)
app.get('/api', (req, res) => {
  res.json({
    name: 'Inventory Management API',
    version: '1.0.0',
    documentation: `${env.API_PREFIX}/health`,
    nodeEnv: env.NODE_ENV
  });
});

// Production Static Frontend Serving (if built frontend/dist exists)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    // If request starts with API prefix, pass through to 404 handler
    if (req.path.startsWith(env.API_PREFIX) || req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // If no built frontend is present, serve JSON info on root
  app.get('/', (req, res) => {
    res.json({
      name: 'Inventory Management API',
      version: '1.0.0',
      status: 'active',
      documentation: `${env.API_PREFIX}/health`
    });
  });
}

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
