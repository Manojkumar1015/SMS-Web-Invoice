import { z } from 'zod';

export const invoiceLineItemSchema = z.object({
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

export const invoiceCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  quoteId: z.string().optional().or(z.literal('')),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled']).default('draft'),
  subtotal: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
  templateId: z.string().optional().or(z.literal('')),
  items: z.array(invoiceLineItemSchema).min(1, 'At least one item is required'),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial();
