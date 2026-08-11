import { IExpenseService, ExpenseSummaryMetrics } from '../interfaces/ExpenseService';
import { Expense, ExpenseCreateInput } from '@/types/expense';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockExpenses } from '@/data/mockExpenses';

export class MockExpenseService implements IExpenseService {
  private expenses: Expense[] = [...mockExpenses];

  async getExpenses(
    params?: FilterParams & { category?: string; expenseType?: string; billable?: boolean; customerId?: string }
  ): Promise<PaginatedResult<Expense>> {
    let result = [...this.expenses];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.expenseNumber.toLowerCase().includes(q) ||
          e.vendorName.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.customerName && e.customerName.toLowerCase().includes(q))
      );
    }

    if (params?.category && params.category !== 'all') {
      result = result.filter((e) => e.category === params.category);
    }

    if (params?.expenseType && params.expenseType !== 'all') {
      result = result.filter((e) => e.expenseType === params.expenseType);
    }

    if (params?.billable !== undefined) {
      result = result.filter((e) => e.billable === params.billable);
    }

    if (params?.customerId && params.customerId !== 'all') {
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

  async getRecentExpenses(limit = 5): Promise<Expense[]> {
    return this.expenses.slice(0, limit);
  }

  async getExpenseSummary(): Promise<ExpenseSummaryMetrics> {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const totalExpenses = this.expenses.reduce((acc, e) => (e.status !== 'cancelled' ? acc + e.totalAmount : acc), 0);
    const thisMonth = this.expenses.reduce(
      (acc, e) => (e.status !== 'cancelled' && e.date.startsWith(currentMonth) ? acc + e.totalAmount : acc),
      0
    );
    const customerExpenses = this.expenses.reduce(
      (acc, e) => (e.status !== 'cancelled' && e.expenseType === 'customer' ? acc + e.totalAmount : acc),
      0
    );
    const businessExpenses = this.expenses.reduce(
      (acc, e) => (e.status !== 'cancelled' && e.expenseType === 'business' ? acc + e.totalAmount : acc),
      0
    );
    const billableExpenses = this.expenses.reduce(
      (acc, e) => (e.status !== 'cancelled' && e.billable ? acc + e.totalAmount : acc),
      0
    );

    return {
      totalExpenses,
      thisMonth,
      customerExpenses,
      businessExpenses,
      billableExpenses,
    };
  }

  async createExpense(data: ExpenseCreateInput): Promise<Expense> {
    const newId = `exp-${Date.now()}`;
    const expNum = `EXP-2026-${String(this.expenses.length + 1).padStart(3, '0')}`;
    const totalAmount = data.amount + (data.taxAmount || 0);

    const newExpense: Expense = {
      ...data,
      id: newId,
      expenseNumber: expNum,
      totalAmount,
      status: data.billable ? 'billable' : 'recorded',
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'created',
          title: 'Expense Recorded',
          timestamp: new Date().toISOString(),
          user: 'Current Admin User',
          details: `Logged ${data.category} expense of ₹${totalAmount.toLocaleString('en-IN')}`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.expenses.unshift(newExpense);
    return newExpense;
  }

  async updateExpense(id: string, data: Partial<ExpenseCreateInput>): Promise<Expense> {
    const idx = this.expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');

    const current = this.expenses[idx];
    const amount = data.amount !== undefined ? data.amount : current.amount;
    const taxAmount = data.taxAmount !== undefined ? data.taxAmount : current.taxAmount;

    const updated: Expense = {
      ...current,
      ...data,
      totalAmount: amount + taxAmount,
    };

    this.expenses[idx] = updated;
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const initialLen = this.expenses.length;
    this.expenses = this.expenses.filter((e) => e.id !== id);
    return this.expenses.length < initialLen;
  }

  async duplicateExpense(id: string): Promise<Expense> {
    const existing = await this.getExpenseById(id);
    if (!existing) throw new Error('Expense not found');

    const newId = `exp-${Date.now()}`;
    const duplicatedNum = `EXP-2026-${String(this.expenses.length + 1).padStart(3, '0')}`;

    const duplicated: Expense = {
      ...existing,
      id: newId,
      expenseNumber: duplicatedNum,
      createdAt: new Date().toISOString(),
    };

    this.expenses.unshift(duplicated);
    return duplicated;
  }

  async convertExpenseToInvoice(
    expenseId: string,
    targetInvoiceId?: string
  ): Promise<{ success: boolean; invoiceId: string; invoiceNumber: string }> {
    const target = await this.getExpenseById(expenseId);
    if (!target) throw new Error('Expense not found');

    const assignedInvId = targetInvoiceId || 'inv-002';
    const assignedInvNum = targetInvoiceId ? `INV-${targetInvoiceId}` : 'INV-2026-002';

    target.status = 'added_to_invoice';
    target.billedInvoiceId = assignedInvId;
    target.billedInvoiceNumber = assignedInvNum;

    if (!target.activities) target.activities = [];
    target.activities.push({
      id: `act-${Date.now()}`,
      type: 'added_to_invoice',
      title: 'Added to Customer Invoice',
      timestamp: new Date().toISOString(),
      user: 'Current Admin User',
      details: `Expense attached to ${assignedInvNum}`,
    });

    return {
      success: true,
      invoiceId: assignedInvId,
      invoiceNumber: assignedInvNum,
    };
  }

  async getCustomerExpenses(customerId: string): Promise<Expense[]> {
    return this.expenses.filter((e) => e.customerId === customerId);
  }
}
