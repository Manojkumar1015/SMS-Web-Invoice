export type ExpenseCategory =
  | 'Office Supplies'
  | 'Software & Subscriptions'
  | 'Travel & Lodging'
  | 'Utilities & Internet'
  | 'Professional Services'
  | 'Marketing & Ads'
  | 'Hardware & Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  customerId?: string;
  customerName?: string;
  date: string;
  amount: number;
  taxAmount: number;
  vendorName: string;
  type: 'Billable' | 'Non-Billable';
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCreateInput = Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>;
