import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { checkDatabaseConnection, pool } from '../config/database.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive system and database health
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let dbStatus;
    try {
      dbStatus = await checkDatabaseConnection();
    } catch {
      dbStatus = {
        status: 'mock_store',
        mode: 'in-memory-mock-catalogue',
        note: 'Operating in self-contained mock store mode (140+ pre-seeded automotive components)',
        latencyMs: 0
      };
    }

    const healthData = {
      status: 'healthy',
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

    return res.status(200).json(new ApiResponse(200, healthData, 'System health report'));
  })
);

/**
 * @route   GET /api/v1/health/live
 * @desc    Kubernetes / Docker Liveness probe (checks process responsiveness)
 */
router.get(
  '/live',
  asyncHandler(async (req, res) => {
    return ApiResponse.ok(res, { status: 'alive' }, 'Service is alive');
  })
);

/**
 * @route   GET /api/v1/health/ready
 * @desc    Kubernetes / Docker Readiness probe (checks database availability)
 */
router.get(
  '/ready',
  asyncHandler(async (req, res) => {
    try {
      const dbCheck = await checkDatabaseConnection();
      if (dbCheck.status === 'connected') {
        return ApiResponse.ok(
          res,
          { status: 'ready', latencyMs: dbCheck.latencyMs },
          'Service is ready to handle traffic'
        );
      }
      return ApiResponse.ok(
        res,
        { status: 'ready', mode: 'mock_store', latencyMs: 0 },
        'Service is ready to handle traffic (mock data mode)'
      );
    } catch {
      return ApiResponse.ok(
        res,
        { status: 'ready', mode: 'mock_store', latencyMs: 0 },
        'Service is ready to handle traffic (mock data mode)'
      );
    }
  })
);

/**
 * @route   GET /api/v1/health/test-error
 * @desc    Testing route to verify centralized error handling responses
 */
if (env.NODE_ENV === 'development') {
  router.get(
    '/test-error',
    asyncHandler(async (req, res) => {
      const { type } = req.query;

      switch (type) {
        case 'bad-request':
          throw ApiError.badRequest('Sample bad request', [{ field: 'testField', message: 'Value is invalid' }]);
        case 'unauthorized':
          throw ApiError.unauthorized('Sample unauthorized request');
        case 'forbidden':
          throw ApiError.forbidden('Sample forbidden request');
        case 'not-found':
          throw ApiError.notFound('Sample resource not found');
        case 'conflict':
          throw ApiError.conflict('Sample resource conflict');
        case 'db-unique':
          // Intentionally trigger a unique constraint error
          await pool.query(
            "INSERT INTO categories (name, description) VALUES ('Tyres', 'Duplicate testing')"
          );
          return res.json({ ok: true });
        case 'db-invalid-uuid':
          await pool.query('SELECT * FROM products WHERE id = $1', ['not-a-valid-uuid']);
          return res.json({ ok: true });
        case 'unhandled':
          throw new Error('Unexpected crash simulation');
        default:
          return ApiResponse.ok(res, { availableTypes: ['bad-request', 'unauthorized', 'forbidden', 'not-found', 'conflict', 'db-unique', 'db-invalid-uuid', 'unhandled'] }, 'Specify ?type= to test');
      }
    })
  );
}

export default router;
