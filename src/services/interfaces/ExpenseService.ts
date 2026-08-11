import { Expense, ExpenseCreateInput } from '@/types/expense';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface IExpenseService {
  getExpenses(params?: FilterParams): Promise<PaginatedResult<Expense>>;
  getExpenseById(id: string): Promise<Expense | null>;
  createExpense(data: ExpenseCreateInput): Promise<Expense>;
  getRecentExpenses(limit?: number): Promise<Expense[]>;
  getExpensesByCustomer(customerId: string): Promise<Expense[]>;
}
