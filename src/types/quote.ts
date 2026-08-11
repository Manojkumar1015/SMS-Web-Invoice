export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface DocumentItem {
  id: string;
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number; // rate discount amount or percentage
  taxRate: number; // tax percentage e.g. 18
  amount: number; // computed line total
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  expiryDate: string;
  items: DocumentItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  terms?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export type QuoteCreateInput = Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>;
