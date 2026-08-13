export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Credit / Debit Card' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'other', label: 'Other' },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];
