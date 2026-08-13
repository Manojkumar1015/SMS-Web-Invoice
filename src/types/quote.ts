export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'converted';

export interface DocumentItem {
  id: string;
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  unitPrice?: number;
  discount: number; // rate discount amount
  taxRate: number; // tax percentage e.g. 18
  amount: number; // computed line total
}

export interface QuoteActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  type: 'created' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'converted' | 'updated';
}

export interface Quote {
  id: string;
  quoteNumber: string;
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
  expiryDate: string;
  quoteDate?: string;
  validUntil?: string;
  paymentTerms?: string;
  items: DocumentItem[];
  subtotal: number;
  discount?: number;
  discountTotal: number;
  tax?: number;
  taxTotal: number;
  total: number;
  notes?: string;
  terms?: string;
  status: QuoteStatus;
  activities?: QuoteActivity[];
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuoteCreateInput = Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> & { quoteNumber?: string };
