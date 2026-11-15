import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema
} from '../validators/product.validator.js';
import { searchQuerySchema } from '../validators/search.validator.js';

const router = Router();

// Standard paginated listing
router.get('/', validate(productListQuerySchema, 'query'), ProductController.getAll);

// Smart Search route (must be mounted before /:id)
router.get('/search', validate(searchQuerySchema, 'query'), ProductController.search);

// Product details by UUID
router.get('/:id', validate(uuidParamSchema, 'params'), ProductController.getById);

// Create product
router.post('/', validate(createProductSchema, 'body'), ProductController.create);

// Update product
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  ProductController.update
);

// Delete product
router.delete('/:id', validate(uuidParamSchema, 'params'), ProductController.delete);

export default router;
