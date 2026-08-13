import { ExpenseRepository, ExpenseQueryOptions } from '@/repositories/expense.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Expense, ExpenseCreateInput } from '@/types/expense';

export class ExpenseService {
  private repo = new ExpenseRepository();

  private mapRowToExpense(row: any): Expense {
    return {
      id: row.id,
      expenseNumber: row.expense_number,
      expenseType: 'business',
      category: row.category,
      date: row.expense_date ? new Date(row.expense_date).toISOString().split('T')[0] : '',
      amount: Number(row.amount) || 0,
      taxAmount: 0,
      totalAmount: Number(row.amount) || 0,
      vendorName: row.vendor || '',
      description: row.description,
      billable: false,
      status: row.status || 'recorded',
      paymentMethod: row.payment_method || 'bank_transfer',
      notes: row.notes || undefined,
      createdAt: row.created_at,
    };
  }

  async listExpenses(context: AuthContext, options: Omit<ExpenseQueryOptions, 'organizationId'>) {
    const res = await this.repo.list({
      organizationId: context.organization.id,
      ...options,
    });

    return {
      data: res.data.map((r: any) => this.mapRowToExpense(r)),
      total: res.total,
    };
  }

  async getExpenseById(context: AuthContext, id: string): Promise<Expense> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToExpense(row);
  }

  async createExpense(context: AuthContext, input: ExpenseCreateInput): Promise<Expense> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload = {
      organization_id: context.organization.id,
      category: input.category,
      description: input.description,
      amount: input.amount,
      expense_date: new Date(input.date).toISOString(),
      payment_method: input.paymentMethod || 'bank_transfer',
      vendor: input.vendorName || null,
      notes: input.notes || null,
      status: 'recorded',
      created_by: context.user.id,
      updated_by: context.user.id,
    };

    const row = await this.repo.create(payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Expense', row.id, {
      action: 'expense.created',
      amount: input.amount,
    });

    return this.mapRowToExpense(row);
  }

  async updateExpense(context: AuthContext, id: string, input: Partial<ExpenseCreateInput>): Promise<Expense> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.category) payload.category = input.category;
    if (input.description) payload.description = input.description;
    if (input.amount) payload.amount = input.amount;
    if (input.date) payload.expense_date = new Date(input.date).toISOString();
    if (input.paymentMethod) payload.payment_method = input.paymentMethod;
    if (input.vendorName !== undefined) payload.vendor = input.vendorName;
    if (input.notes !== undefined) payload.notes = input.notes;

    const row = await this.repo.update(id, context.organization.id, payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Expense', id, {
      action: 'expense.updated',
    });

    return this.mapRowToExpense(row);
  }

  async deleteExpense(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin'], context.membership.role);
    await this.repo.delete(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Expense', id, {
      action: 'expense.deleted',
    });

    return true;
  }
}
