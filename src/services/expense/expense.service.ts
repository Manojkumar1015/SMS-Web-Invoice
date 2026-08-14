import { ExpenseRepository, ExpenseQueryOptions } from '@/repositories/expense.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { ValidationError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/api/audit';
import { Expense, ExpenseCreateInput } from '@/types/expense';

export class ExpenseService {
  private repo = new ExpenseRepository();

  private mapRowToExpense(row: any): Expense {
    return {
      id: row.id,
      expenseNumber: row.expense_number,
      expenseType: (row.expense_scope || row.expense_type || 'business') as any,
      category: row.category,
      date: row.expense_date ? new Date(row.expense_date).toISOString().split('T')[0] : '',
      amount: Number(row.amount) || 0,
      taxAmount: 0,
      totalAmount: Number(row.amount) || 0,
      vendorName: row.vendor || '',
      description: row.description,
      billable: Boolean(row.billable),
      customerId: row.customer_id || undefined,
      customerName: row.customer?.display_name || undefined,
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

  async getExpenseSummary(context: AuthContext) {
    return this.repo.getMetrics(context.organization.id);
  }

  async getExpenseById(context: AuthContext, id: string): Promise<Expense> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToExpense(row);
  }

  async createExpense(context: AuthContext, input: ExpenseCreateInput): Promise<Expense> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const expenseScope = input.expenseType || 'business';
    const customerId = expenseScope === 'customer' && input.customerId ? input.customerId.trim() : null;

    if (expenseScope === 'customer' && !customerId) {
      throw new ValidationError('Target customer is required for Customer Expense');
    }

    const expenseDate = input.expenseDate || input.date || new Date().toISOString().split('T')[0];
    const vendor = input.vendorName || input.vendor || null;

    const payload = {
      organization_id: context.organization.id,
      expense_scope: expenseScope,
      billable: Boolean(input.billable),
      customer_id: customerId,
      category: input.category,
      description: input.description,
      amount: input.amount,
      expense_date: new Date(expenseDate).toISOString(),
      payment_method: input.paymentMethod || 'bank_transfer',
      vendor,
      reference_number: input.referenceNumber || null,
      notes: input.notes || null,
      status: input.status || 'approved',
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

    if (input.expenseType) payload.expense_scope = input.expenseType;
    if (input.billable !== undefined) payload.billable = Boolean(input.billable);
    if (input.customerId !== undefined) payload.customer_id = input.customerId || null;
    if (input.category) payload.category = input.category;
    if (input.description) payload.description = input.description;
    if (input.amount) payload.amount = input.amount;
    const expDateStr = input.expenseDate || input.date;
    if (expDateStr) payload.expense_date = new Date(expDateStr).toISOString();
    if (input.paymentMethod) payload.payment_method = input.paymentMethod;
    const vendorVal = input.vendorName !== undefined ? input.vendorName : input.vendor;
    if (vendorVal !== undefined) payload.vendor = vendorVal;
    if (input.referenceNumber !== undefined) payload.reference_number = input.referenceNumber;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.status) payload.status = input.status;

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
