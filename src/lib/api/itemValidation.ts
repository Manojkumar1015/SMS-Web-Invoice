import { z } from 'zod';

export const itemCreateSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(150),
  sku: z.string().max(50).optional().or(z.literal('')),
  type: z.enum(['product', 'service']).default('product'),
  description: z.string().max(500).optional().or(z.literal('')),
  unit: z.string().min(1, 'Unit is required').max(20).default('pcs'),
  sellingPrice: z.number().min(0, 'Selling price must be greater than or equal to 0'),
  purchasePrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).default(18),
  hsnSac: z.string().max(20).optional().or(z.literal('')),
  discountRate: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const itemUpdateSchema = itemCreateSchema.partial();
