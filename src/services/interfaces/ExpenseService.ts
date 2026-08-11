import { Expense, ExpenseCreateInput } from '@/types/expense';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface ExpenseSummaryMetrics {
  totalExpenses: number;
  thisMonth: number;
  customerExpenses: number;
  businessExpenses: number;
  billableExpenses: number;
}

export interface IExpenseService {
  getExpenses(
    params?: FilterParams & { category?: string; expenseType?: string; billable?: boolean; customerId?: string }
  ): Promise<PaginatedResult<Expense>>;
  getExpenseById(id: string): Promise<Expense | null>;
  getRecentExpenses(limit?: number): Promise<Expense[]>;
  getExpenseSummary(): Promise<ExpenseSummaryMetrics>;
  createExpense(data: ExpenseCreateInput): Promise<Expense>;
  updateExpense(id: string, data: Partial<ExpenseCreateInput>): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;
  duplicateExpense(id: string): Promise<Expense>;
  convertExpenseToInvoice(expenseId: string, targetInvoiceId?: string): Promise<{ success: boolean; invoiceId: string; invoiceNumber: string }>;
  getCustomerExpenses(customerId: string): Promise<Expense[]>;
}
