import { z } from 'zod';

const stockRequestItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .uuid('Product ID must be a valid UUID'),
  requestedQuantity: z
    .coerce
    .number({ required_error: 'Requested quantity is required' })
    .int('Requested quantity must be an integer')
    .min(1, 'Requested quantity must be at least 1 unit')
});

export const createStockRequestSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  items: z
    .array(stockRequestItemSchema, { required_error: 'At least one product item is required' })
    .min(1, 'Stock request must contain at least one product item')
    .refine(
      (items) => {
        const productIds = items.map((i) => i.productId);
        return new Set(productIds).size === productIds.length;
      },
      { message: 'Duplicate product entries in a single stock request are not allowed' }
    )
});

export const verifyStockRequestSchema = z.object({
  items: z
    .array(stockRequestItemSchema, { required_error: 'Items array is required' })
    .min(1, 'At least one item is required for stock verification')
    .refine(
      (items) => {
        const productIds = items.map((i) => i.productId);
        return new Set(productIds).size === productIds.length;
      },
      { message: 'Duplicate product entries are not allowed' }
    )
});

export const updateStockRequestSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  items: z
    .array(stockRequestItemSchema, { required_error: 'At least one product item is required' })
    .min(1, 'Stock request must contain at least one product item')
    .refine(
      (items) => {
        const productIds = items.map((i) => i.productId);
        return new Set(productIds).size === productIds.length;
      },
      { message: 'Duplicate product entries in a single stock request are not allowed' }
    )
});

export const listStockRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['all', 'DRAFT', 'CONFIRMED', 'CANCELLED']).default('all'),
  search: z.string().trim().optional()
});

export const stockRequestIdParamSchema = z.object({
  id: z.string().uuid('Invalid stock request UUID')
});

