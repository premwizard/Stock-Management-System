import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      const allowedOrigins = [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
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

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Inventory Management API',
    version: '1.0.0',
    documentation: `${env.API_PREFIX}/health`
  });
});

// API Routes
app.use(env.API_PREFIX, apiRouter);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

