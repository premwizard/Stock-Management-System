import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { productIdParamSchema } from '../validators/common.validator.js';
import {
  stockInSchema,
  stockOutSchema,
  stockAdjustSchema,
  inventoryListQuerySchema,
  movementsListQuerySchema
} from '../validators/inventory.validator.js';

const router = Router();

// Current stock levels listing
router.get('/', validate(inventoryListQuerySchema, 'query'), InventoryController.getAll);

// Audit trail of movements (mounted before /:productId)
router.get('/movements', validate(movementsListQuerySchema, 'query'), InventoryController.getMovements);

// Current stock for specific product
router.get('/:productId', validate(productIdParamSchema, 'params'), InventoryController.getByProductId);

// Stock mutations
router.post('/stock-in', validate(stockInSchema, 'body'), InventoryController.stockIn);
router.post('/stock-out', validate(stockOutSchema, 'body'), InventoryController.stockOut);
router.post('/adjust', validate(stockAdjustSchema, 'body'), InventoryController.adjust);

export default router;

