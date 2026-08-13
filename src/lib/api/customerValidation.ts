import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default('India'),
});

export const customerCreateSchema = z.object({
  customerType: z.enum(['business', 'individual']).default('business'),
  companyName: z.string().min(1, 'Company name or display name is required').max(150),
  displayName: z.string().min(1, 'Display name is required').max(150),
  contactPerson: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: z.string().max(15).optional().or(z.literal('')),
  pan: z.string().max(10).optional().or(z.literal('')),
  paymentTerms: z.string().default('Net 30'),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  sameAsBillingAddress: z.boolean().default(true),
  notes: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const customerUpdateSchema = customerCreateSchema.partial();
