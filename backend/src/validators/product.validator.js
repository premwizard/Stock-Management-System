import { z } from 'zod';

export const imageUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/') && !trimmed.startsWith('data:image')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  })
  .refine(
    (val) => {
      if (!val) return true;
      if (val.startsWith('data:image')) return true;
      try {
        new URL(val.startsWith('/') ? `http://localhost${val}` : val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid image URL format' }
  )
  .default('');

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
    .regex(/^[A-Za-z0-9-_]+$/, 'SKU may only contain letters, numbers, hyphens, and underscores')
    .transform((s) => s.toUpperCase()),
  categoryId: z.string({ required_error: 'Category ID is required' }).uuid('Invalid category ID UUID'),
  brand: z
    .string()
    .trim()
    .max(100, 'Brand cannot exceed 100 characters')
    .optional()
    .or(z.null())
    .transform((v) => (v && v.trim() ? v.trim() : 'Generic'))
    .default('Generic'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .or(z.null())
    .transform((v) => (v ? v.trim() : ''))
    .default(''),
  unit: z
    .string()
    .trim()
    .max(20, 'Unit cannot exceed 20 characters')
    .optional()
    .or(z.null())
    .transform((v) => (v && v.trim() ? v.trim() : 'pcs'))
    .default('pcs'),
  imageUrl: imageUrlSchema,
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be 0 or greater').default(10),
  initialStock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').default(0)
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(255).optional(),
  categoryId: z.string().uuid('Invalid category ID UUID').optional(),
  brand: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.null())
    .transform((v) => (v && v.trim() ? v.trim() : 'Generic')),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.null())
    .transform((v) => (v ? v.trim() : '')),
  unit: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.null())
    .transform((v) => (v && v.trim() ? v.trim() : 'pcs')),
  imageUrl: imageUrlSchema.optional(),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be 0 or greater').optional(),
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
