import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { checkDatabaseConnection } from '../config/database.js';
import { env } from '../config/env.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let dbStatus;
    try {
      dbStatus = await checkDatabaseConnection();
    } catch (err) {
      dbStatus = {
        status: 'disconnected',
        error: err.message,
        latencyMs: -1
      };
    }

    const healthData = {
      status: dbStatus.status === 'connected' ? 'healthy' : 'degraded',
      service: 'inventory-management-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      database: dbStatus,
      memoryUsage: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    };

    return ApiResponse.ok(res, healthData, 'System is healthy');
  })
);

export default router;

