export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'upi' | 'cash' | 'cheque';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export type PaymentCreateInput = Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>;
