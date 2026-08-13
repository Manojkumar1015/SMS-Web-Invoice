import { z } from 'zod';

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const addressSchema = z.object({
  street: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default('India'),
});

export const customerCreateSchema = z.object({
  customerType: z.enum(['business', 'individual']).default('business'),
  companyName: z.string().max(150).optional().or(z.literal('')),
  displayName: z.string().min(1, 'Display name is required').max(150),
  contactPerson: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: z
    .string()
    .transform((val) => val?.trim().toUpperCase() || '')
    .pipe(
      z.string().refine((val) => val === '' || gstinRegex.test(val), {
        message: 'Invalid GSTIN format. Expected format: 27AAAAA0000A1Z5 (15 characters)',
      })
    )
    .optional(),
  pan: z
    .string()
    .transform((val) => val?.trim().toUpperCase() || '')
    .pipe(
      z.string().refine((val) => val === '' || panRegex.test(val), {
        message: 'Invalid PAN format. Expected format: AAAAA0000A (10 characters)',
      })
    )
    .optional(),
  paymentTerms: z.string().default('Net 30'),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  sameAsBillingAddress: z.boolean().default(true),
  notes: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const customerUpdateSchema = customerCreateSchema.partial();
