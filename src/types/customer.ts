export type CustomerType = 'business' | 'individual';
export type CustomerStatus = 'active' | 'inactive';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  customerType: CustomerType;
  companyName: string;
  displayName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin?: string;
  pan?: string;
  paymentTerms: string; // e.g. "Net 30", "Due on Receipt"
  notes?: string;
  billingAddress: Address;
  shippingAddress: Address;
  sameAsBillingAddress: boolean;
  status: CustomerStatus;
  totalInvoiced: number;
  paid: number;
  outstanding: number;
  createdAt: string;
  updatedAt: string;
}

export type CustomerCreateInput = Omit<Customer, 'id' | 'totalInvoiced' | 'paid' | 'outstanding' | 'createdAt' | 'updatedAt'>;
