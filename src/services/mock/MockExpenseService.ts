import { IExpenseService } from '../interfaces/ExpenseService';
import { Expense, ExpenseCreateInput } from '@/types/expense';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockExpenses } from '@/data/mockExpenses';

export class MockExpenseService implements IExpenseService {
  private expenses: Expense[] = [...mockExpenses];

  async getExpenses(params?: FilterParams): Promise<PaginatedResult<Expense>> {
    let result = [...this.expenses];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.expenseNumber.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.vendorName.toLowerCase().includes(q) ||
          (e.customerName && e.customerName.toLowerCase().includes(q))
      );
    }

    if (params?.category && params.category !== 'all') {
      result = result.filter((e) => e.category === params.category);
    }

    if (params?.customerId) {
      result = result.filter((e) => e.customerId === params.customerId);
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    return this.expenses.find((e) => e.id === id) || null;
  }

  async createExpense(data: ExpenseCreateInput): Promise<Expense> {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-2026-00${Math.floor(10 + Math.random() * 90)}`,
      createdAt: new Date().toISOString(),
    };
    this.expenses.unshift(newExpense);
    return newExpense;
  }

  async getRecentExpenses(limit = 5): Promise<Expense[]> {
    return [...this.expenses].slice(0, limit);
  }

  async getExpensesByCustomer(customerId: string): Promise<Expense[]> {
    return this.expenses.filter((e) => e.customerId === customerId);
  }
}
