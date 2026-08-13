export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'credit_card' | 'card' | 'cheque' | 'other';

export type PaymentStatus = 'received' | 'partially_allocated' | 'unallocated' | 'cancelled';

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
}

export interface PaymentActivity {
  id: string;
  type: 'created' | 'allocated' | 'receipt_sent' | 'edited' | 'cancelled';
  title: string;
  timestamp: string;
  user: string;
  details?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  date: string;
  paymentDate?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status: PaymentStatus;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocations: PaymentAllocation[];
  attachmentName?: string;
  attachmentSize?: string;
  attachmentUrl?: string;
  activities?: PaymentActivity[];
  createdAt: string;
}

export type PaymentCreateInput = Omit<
  Payment,
  'id' | 'paymentNumber' | 'status' | 'allocatedAmount' | 'unallocatedAmount' | 'allocations' | 'createdAt'
> & { paymentNumber?: string };
