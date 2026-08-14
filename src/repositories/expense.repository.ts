import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/api/errors';

export interface ExpenseQueryOptions {
  organizationId: string;
  search?: string;
  category?: string;
  expenseScope?: string;
  billable?: boolean;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ExpenseRepository {
  async list(options: ExpenseQueryOptions) {
    const supabase = createClient();
    const {
      organizationId,
      search,
      category,
      expenseScope,
      billable,
      customerId,
      page = 1,
      pageSize = 25,
      sortField = 'created_at',
      sortOrder = 'desc',
    } = options;

    let query = (supabase.from('expenses' as any) as any)
      .select('*, customer:customers(id, display_name)', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (expenseScope && expenseScope !== 'all') {
      query = query.eq('expense_scope', expenseScope);
    }

    if (billable !== undefined) {
      query = query.eq('billable', billable);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`expense_number.ilike.${term},description.ilike.${term},vendor.ilike.${term},category.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch expenses: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('expenses' as any) as any)
      .select('*, customer:customers(id, display_name)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Expense with ID ${id} not found.`);
    }

    return data;
  }

  async getMetrics(organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('expenses' as any) as any)
      .select('id, amount, expense_date, expense_scope, billable')
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(`Failed to fetch expense summary: ${error.message}`);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalExpenses = 0;
    let thisMonth = 0;
    let customerExpenses = 0;
    let businessExpenses = 0;
    let billableExpenses = 0;

    (data || []).forEach((row: any) => {
      const amt = Number(row.amount) || 0;
      totalExpenses += amt;

      const expDate = row.expense_date ? new Date(row.expense_date) : null;
      if (expDate && expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth) {
        thisMonth += amt;
      }

      if (row.expense_scope === 'customer') {
        customerExpenses += amt;
      } else {
        businessExpenses += amt;
      }

      if (row.billable) {
        billableExpenses += amt;
      }
    });

    return {
      totalExpenses,
      thisMonth,
      customerExpenses,
      businessExpenses,
      billableExpenses,
    };
  }

  async getNextExpenseNumber(organizationId: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('generate_next_number', {
      _org_id: organizationId,
      _entity_type: 'expense',
      _default_prefix: 'EXP-',
    });

    if (!error && data) {
      return data;
    }

    const { count } = await (supabase.from('expenses' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const nextNum = (count || 0) + 1;
    return `EXP-${String(nextNum).padStart(5, '0')}`;
  }

  async create(payload: Record<string, any>) {
    const supabase = createClient();
    const expenseNumber = payload.expense_number || (await this.getNextExpenseNumber(payload.organization_id));

    const { data, error } = await (supabase.from('expenses' as any) as any)
      .insert({
        ...payload,
        expense_number: expenseNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, customer:customers(id, display_name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create expense: ${error.message}`);
    }

    return data;
  }

  async update(id: string, organizationId: string, payload: Record<string, any>) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('expenses' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('*, customer:customers(id, display_name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update expense: ${error.message}`);
    }

    return data;
  }

  async delete(id: string, organizationId: string) {
    const supabase = createClient();
    const { error } = await (supabase.from('expenses' as any) as any)
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(`Failed to delete expense: ${error.message}`);
    }

    return true;
  }
}
