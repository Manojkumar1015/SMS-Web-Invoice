import { z } from 'zod';

const baseExpenseSchema = z.object({
  expenseNumber: z.string().optional().or(z.literal('')),
  expenseType: z.enum(['business', 'customer']).optional().default('business'),
  billable: z.boolean().optional().default(false),
  customerId: z.string().optional().nullable().or(z.literal('')),
  category: z.string().min(1, 'Expense category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().gt(0, 'Expense amount must be greater than 0'),
  expenseDate: z.string().optional(),
  date: z.string().optional(),
  paymentMethod: z.string().default('bank_transfer'),
  vendor: z.string().optional().nullable().or(z.literal('')),
  vendorName: z.string().optional().nullable().or(z.literal('')),
  referenceNumber: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  status: z.string().default('approved'),
});

export const expenseCreateSchema = baseExpenseSchema.superRefine((data, ctx) => {
  if (data.expenseType === 'customer' && (!data.customerId || !data.customerId.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Target customer is required for Customer Expense',
      path: ['customerId'],
    });
  }
});

export const expenseUpdateSchema = baseExpenseSchema.partial();



