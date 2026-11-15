import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(255, 'Product name cannot exceed 255 characters'),
  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9-_]+$/, 'SKU may only contain letters, numbers, hyphens, and underscores'),
  categoryId: z.string({ required_error: 'Category ID is required' }).uuid('Invalid category ID UUID'),
  brand: z.string().trim().max(100).optional().default('Generic'),
  description: z.string().trim().max(2000).optional().default(''),
  unit: z.string().trim().max(20).optional().default('pcs'),
  imageUrl: z.string().trim().url('Invalid image URL format').optional().or(z.literal('')).default(''),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be 0 or greater').default(10),
  initialStock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').default(0)
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  categoryId: z.string().uuid('Invalid category ID UUID').optional(),
  brand: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  unit: z.string().trim().max(20).optional(),
  imageUrl: z.string().trim().url('Invalid image URL format').optional().or(z.literal('')).optional(),
  minimumStock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  status: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).default('all'),
  search: z.string().trim().optional(),
  sort: z.enum(['name', 'sku', 'brand', 'quantity', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

