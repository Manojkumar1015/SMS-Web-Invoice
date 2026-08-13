import { z } from 'zod';

export const paymentCreateSchema = z.object({
  paymentNumber: z.string().optional().or(z.literal('')),
  invoiceId: z.string().min(1, 'Invoice is required'),
  customerId: z.string().optional(),
  amount: z.number().gt(0, 'Payment amount must be greater than 0'),
  paymentDate: z.string().optional(),
  date: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'credit_card', 'cheque', 'other'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  referenceNumber: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
});

export const paymentUpdateSchema = paymentCreateSchema.partial();

