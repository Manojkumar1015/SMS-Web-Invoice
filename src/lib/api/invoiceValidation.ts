import { z } from 'zod';

export const invoiceLineItemSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().optional().nullable().or(z.literal('')),
  name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  rate: z.number().min(0, 'Rate cannot be negative').optional(),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  lineTotal: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const invoiceCreateSchema = z.object({
  invoiceNumber: z.string().optional().or(z.literal('')),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  quoteId: z.string().optional().nullable().or(z.literal('')),
  invoiceDate: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled']).default('draft'),
  subtotal: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountTotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  taxTotal: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  amountPaid: z.number().min(0).optional(),
  amountDue: z.number().min(0).optional(),
  notes: z.string().optional().nullable().or(z.literal('')),
  terms: z.string().optional().nullable().or(z.literal('')),
  templateId: z.string().optional().nullable().or(z.literal('')),
  items: z.array(invoiceLineItemSchema).min(1, 'At least one item is required'),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial();

