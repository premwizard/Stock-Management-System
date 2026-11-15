import { z } from 'zod';

export const stockInSchema = z.object({
  productId: z.string({ required_error: 'Product ID is required' }).uuid('Invalid product ID UUID'),
  quantity: z
    .coerce
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(1, 'Stock-in quantity must be at least 1 unit'),
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(500, 'Reason cannot exceed 500 characters')
});

export const stockOutSchema = z.object({
  productId: z.string({ required_error: 'Product ID is required' }).uuid('Invalid product ID UUID'),
  quantity: z
    .coerce
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(1, 'Stock-out quantity must be at least 1 unit'),
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(500, 'Reason cannot exceed 500 characters')
});

export const stockAdjustSchema = z.object({
  productId: z.string({ required_error: 'Product ID is required' }).uuid('Invalid product ID UUID'),
  newQuantity: z
    .coerce
    .number({ required_error: 'New quantity is required' })
    .int('New quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(500, 'Reason cannot exceed 500 characters')
});

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().optional(),
  status: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).default('all'),
  search: z.string().trim().optional(),
  sort: z.enum(['name', 'sku', 'quantity', 'updated_at']).default('updated_at'),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

export const movementsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});
