import { DocumentItem } from './quote';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  type: 'created' | 'sent' | 'viewed' | 'payment_received' | 'overdue' | 'cancelled' | 'updated';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  quoteNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerGstin?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  date: string;
  dueDate: string;
  paymentTerms?: string;
  items: DocumentItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  status: InvoiceStatus;
  activities?: InvoiceActivity[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceCreateInput = Omit<Invoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt'> & { invoiceNumber?: string };


