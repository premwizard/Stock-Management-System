import { Router } from 'express';
import { StockRequestController } from '../controllers/stockRequest.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createStockRequestSchema,
  updateStockRequestSchema,
  listStockRequestsQuerySchema,
  stockRequestIdParamSchema
} from '../validators/stockRequest.validator.js';

const router = Router();

// Create new draft stock request
router.post(
  '/',
  validate(createStockRequestSchema, 'body'),
  StockRequestController.create
);

// List paginated stock requests with status and keyword filters
router.get(
  '/',
  validate(listStockRequestsQuerySchema, 'query'),
  StockRequestController.getAll
);

// Get single stock request details by ID
router.get(
  '/:id',
  validate(stockRequestIdParamSchema, 'params'),
  StockRequestController.getById
);

// Update items/notes on an unconfirmed DRAFT stock request
router.put(
  '/:id',
  validate(stockRequestIdParamSchema, 'params'),
  validate(updateStockRequestSchema, 'body'),
  StockRequestController.update
);

// Confirm stock request and execute automatic inventory deduction
router.post(
  '/:id/confirm',
  validate(stockRequestIdParamSchema, 'params'),
  StockRequestController.confirm
);

// Cancel an unconfirmed DRAFT stock request
router.post(
  '/:id/cancel',
  validate(stockRequestIdParamSchema, 'params'),
  StockRequestController.cancel
);

export default router;

