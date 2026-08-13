import { z } from 'zod';

export const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().gt(0, 'Payment amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  referenceNumber: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const paymentUpdateSchema = paymentCreateSchema.partial();
