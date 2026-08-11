import { DocumentItem } from './quote';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  quoteNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerGstin?: string;
  date: string;
  dueDate: string;
  items: DocumentItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceCreateInput = Omit<Invoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt'>;
