import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Must be a valid UUID' })
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid({ message: 'Must be a valid product UUID' })
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional().default('created_at'),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional().default('desc')
});

