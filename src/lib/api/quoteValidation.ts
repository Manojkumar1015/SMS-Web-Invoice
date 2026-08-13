import { z } from 'zod';

export const quoteLineItemSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().optional().or(z.literal('')),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  lineTotal: z.number().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const quoteCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  quoteDate: z.string().min(1, 'Quote date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).default('draft'),
  subtotal: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
  items: z.array(quoteLineItemSchema).min(1, 'At least one item is required'),
});

export const quoteUpdateSchema = quoteCreateSchema.partial();
