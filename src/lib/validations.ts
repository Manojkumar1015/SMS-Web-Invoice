import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const customerFormSchema = z.object({
  customerType: z.enum(['business', 'individual']),
  companyName: z.string().min(1, 'Company name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  paymentTerms: z.string().min(1, 'Payment terms required'),
  notes: z.string().optional(),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  sameAsBillingAddress: z.boolean(),
  status: z.enum(['active', 'inactive']),
});

export const itemFormSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().min(1, 'SKU code is required'),
  type: z.enum(['product', 'service']),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit of measurement is required'),
  sellingPrice: z.coerce.number().min(0, 'Price must be positive'),
  purchasePrice: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0, 'Tax rate must be positive'),
  hsnSac: z.string().optional(),
  discountRate: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive']),
});

export const documentItemSchema = z.object({
  id: z.string(),
  itemId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).default(18),
  amount: z.coerce.number(),
});

export const quoteFormSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  date: z.string().min(1, 'Quote date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  items: z.array(documentItemSchema).min(1, 'Add at least one line item'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']),
});

export const invoiceFormSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerGstin: z.string().optional(),
  date: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(documentItemSchema).min(1, 'Add at least one line item'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled']),
});

export const paymentFormSchema = z.object({
  invoiceId: z.string().min(1, 'Select an invoice'),
  invoiceNumber: z.string().min(1, 'Invoice number required'),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name required'),
  date: z.string().min(1, 'Payment date required'),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'upi', 'cash', 'cheque']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseFormSchema = z.object({
  category: z.enum([
    'Office Supplies',
    'Software & Subscriptions',
    'Travel & Lodging',
    'Utilities & Internet',
    'Professional Services',
    'Marketing & Ads',
    'Hardware & Maintenance',
    'Other',
  ]),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Expense amount must be greater than 0'),
  taxAmount: z.coerce.number().min(0).default(0),
  vendorName: z.string().min(1, 'Vendor name is required'),
  type: z.enum(['Billable', 'Non-Billable']),
  paymentMethod: z.string().min(1, 'Payment method required'),
  notes: z.string().optional(),
});
