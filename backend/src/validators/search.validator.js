import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().default(''),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  status: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

