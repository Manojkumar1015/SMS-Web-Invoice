export type ExpenseType = 'customer' | 'business';

export type ExpenseStatus = 'draft' | 'recorded' | 'approved' | 'billable' | 'added_to_invoice' | 'reimbursed' | 'cancelled' | (string & {});

export type ExpenseCategory =
  | 'Salary'
  | 'Rent'
  | 'Electricity'
  | 'Fuel'
  | 'Travel'
  | 'Transport'
  | 'Materials'
  | 'Marketing'
  | 'Software'
  | 'Office'
  | 'Maintenance'
  | 'Utilities'
  | 'Professional Services'
  | 'Other'
  | (string & {});

export interface ExpenseActivity {
  id: string;
  type: 'created' | 'added_to_invoice' | 'reimbursed' | 'edited' | 'cancelled';
  title: string;
  timestamp: string;
  user: string;
  details?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  expenseType: ExpenseType;
  category: ExpenseCategory;
  customerId?: string;
  customerName?: string;
  date: string;
  expenseDate?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  vendorName: string;
  vendor?: string;
  referenceNumber?: string;
  description: string;
  billable: boolean;
  status: ExpenseStatus;
  paymentMethod: string;
  billedInvoiceId?: string;
  billedInvoiceNumber?: string;
  receiptName?: string;
  receiptSize?: string;
  receiptUrl?: string;
  notes?: string;
  activities?: ExpenseActivity[];
  createdAt: string;
}

export type ExpenseCreateInput = Omit<
  Expense,
  'id' | 'expenseNumber' | 'createdAt' | 'status' | 'totalAmount'
> & { expenseNumber?: string; status?: ExpenseStatus; totalAmount?: number };
