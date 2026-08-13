import { IExpenseService, ExpenseSummaryMetrics } from '../interfaces/ExpenseService';
import { Expense, ExpenseCreateInput } from '@/types/expense';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabaseExpenseService implements IExpenseService {
  async getExpenses(
    params?: FilterParams & { category?: string; expenseType?: string; billable?: boolean; customerId?: string }
  ): Promise<PaginatedResult<Expense>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/v1/expenses?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch expenses: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch expenses');
    }

    return {
      data: json.data || [],
      total: json.meta?.total ?? json.data.length,
      page: json.meta?.page ?? 1,
      pageSize: json.meta?.pageSize ?? 25,
      totalPages: json.meta?.totalPages ?? 1,
    };
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const res = await fetch(`/api/v1/expenses/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch expense: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async getRecentExpenses(limit?: number): Promise<Expense[]> {
    const res = await this.getExpenses({ pageSize: limit || 5 });
    return res.data;
  }

  async getExpenseSummary(): Promise<ExpenseSummaryMetrics> {
    const res = await this.getExpenses({ pageSize: 100 });
    const expenses = res.data;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalExpenses,
      thisMonth: totalExpenses,
      customerExpenses: 0,
      businessExpenses: totalExpenses,
      billableExpenses: 0,
    };
  }

  async createExpense(data: ExpenseCreateInput): Promise<Expense> {
    const res = await fetch('/api/v1/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create expense');
    }
    const json = await res.json();
    return json.data;
  }

  async updateExpense(id: string, data: Partial<ExpenseCreateInput>): Promise<Expense> {
    const res = await fetch(`/api/v1/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to update expense');
    }
    const json = await res.json();
    return json.data;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete expense');
    }
    const json = await res.json();
    return !!json.success;
  }

  async duplicateExpense(id: string): Promise<Expense> {
    const original = await this.getExpenseById(id);
    if (!original) throw new Error('Original expense not found');

    const duplicateInput: ExpenseCreateInput = {
      expenseType: original.expenseType,
      category: original.category,
      date: new Date().toISOString().split('T')[0],
      amount: original.amount,
      taxAmount: original.taxAmount,
      vendorName: original.vendorName,
      description: `${original.description} (Copy)`,
      billable: original.billable,
      paymentMethod: original.paymentMethod,
      notes: original.notes,
    };

    return this.createExpense(duplicateInput);
  }

  async convertExpenseToInvoice(expenseId: string, targetInvoiceId?: string): Promise<{ success: boolean; invoiceId: string; invoiceNumber: string }> {
    throw new Error('Expense to invoice conversion is not configured.');
  }

  async getCustomerExpenses(customerId: string): Promise<Expense[]> {
    return [];
  }
}
