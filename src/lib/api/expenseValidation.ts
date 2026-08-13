import { z } from 'zod';

export const expenseCreateSchema = z.object({
  category: z.string().min(1, 'Expense category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().gt(0, 'Expense amount must be greater than 0'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  paymentMethod: z.string().default('bank_transfer'),
  vendor: z.string().optional().or(z.literal('')),
  referenceNumber: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.string().default('approved'),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();
