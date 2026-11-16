import { z } from 'zod';

const packageItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .uuid('Product ID must be a valid UUID'),
  requiredQuantity: z
    .coerce
    .number({ required_error: 'Required quantity is required' })
    .int('Required quantity must be an integer')
    .min(1, 'Required quantity must be at least 1 unit')
});

export const createVehiclePackageSchema = z.object({
  name: z
    .string({ required_error: 'Package name is required' })
    .trim()
    .min(2, 'Package name must be at least 2 characters')
    .max(150, 'Package name cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true).optional(),
  items: z
    .array(packageItemSchema, { required_error: 'At least one component product is required' })
    .min(1, 'Vehicle package must contain at least one component product')
    .refine(
      (items) => {
        const productIds = items.map((i) => i.productId);
        return new Set(productIds).size === productIds.length;
      },
      { message: 'Duplicate products in the same package are not allowed' }
    )
});

export const updateVehiclePackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Package name must be at least 2 characters')
    .max(150, 'Package name cannot exceed 150 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
  items: z
    .array(packageItemSchema)
    .min(1, 'Vehicle package must contain at least one component product')
    .refine(
      (items) => {
        const productIds = items.map((i) => i.productId);
        return new Set(productIds).size === productIds.length;
      },
      { message: 'Duplicate products in the same package are not allowed' }
    )
    .optional()
});

export const listVehiclePackagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
});

export const vehiclePackageIdParamSchema = z.object({
  id: z.string().uuid('Invalid vehicle package UUID')
});

export const expandPackageQuerySchema = z.object({
  multiplier: z.coerce.number().int().min(1, 'Multiplier must be at least 1').default(1)
});

