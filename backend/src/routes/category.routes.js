import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema
} from '../validators/category.validator.js';

const router = Router();

router.get('/', validate(categoryQuerySchema, 'query'), CategoryController.getAll);
router.get('/:id', validate(uuidParamSchema, 'params'), CategoryController.getById);
router.post('/', validate(createCategorySchema, 'body'), CategoryController.create);
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateCategorySchema, 'body'),
  CategoryController.update
);
router.delete('/:id', validate(uuidParamSchema, 'params'), CategoryController.delete);

export default router;

