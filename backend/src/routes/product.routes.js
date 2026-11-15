import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema
} from '../validators/product.validator.js';

const router = Router();

router.get('/', validate(productListQuerySchema, 'query'), ProductController.getAll);
router.get('/:id', validate(uuidParamSchema, 'params'), ProductController.getById);
router.post('/', validate(createProductSchema, 'body'), ProductController.create);
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  ProductController.update
);
router.delete('/:id', validate(uuidParamSchema, 'params'), ProductController.delete);

export default router;

