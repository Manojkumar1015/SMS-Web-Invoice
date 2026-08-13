import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/api/errors';
import { roundCurrency } from '@/lib/financial';

export interface PaymentQueryOptions {
  organizationId: string;
  search?: string;
  invoiceId?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PaymentRepository {
  async list(options: PaymentQueryOptions) {
    const supabase = createClient();
    const {
      organizationId,
      search,
      invoiceId,
      customerId,
      page = 1,
      pageSize = 25,
      sortField = 'created_at',
      sortOrder = 'desc',
    } = options;

    let query = (supabase.from('payments' as any) as any)
      .select('*, customer:customers(id, display_name, company_name), invoice:invoices(id, invoice_number, total, balance_due)', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`payment_number.ilike.${term},reference_number.ilike.${term},notes.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch payments: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('payments' as any) as any)
      .select('*, customer:customers(*), invoice:invoices(*)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Payment with ID ${id} not found.`);
    }

    return data;
  }

  async getNextPaymentNumber(organizationId: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('generate_next_number', {
      _org_id: organizationId,
      _entity_type: 'payment',
      _default_prefix: 'PAY-',
    });

    if (!error && data) {
      return data;
    }

    const { count } = await (supabase.from('payments' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const nextNum = (count || 0) + 1;
    return `PAY-${String(nextNum).padStart(5, '0')}`;
  }

  async create(payload: Record<string, any>) {
    const supabase = createClient();

    // 1. Fetch invoice and verify organization & balance
    const { data: invoice, error: invError } = await (supabase.from('invoices' as any) as any)
      .select('*')
      .eq('id', payload.invoice_id)
      .eq('organization_id', payload.organization_id)
      .single();

    if (invError || !invoice) {
      throw new NotFoundError(`Invoice with ID ${payload.invoice_id} not found or belongs to another organization.`);
    }

    const paymentAmount = roundCurrency(Number(payload.amount));
    if (paymentAmount <= 0) {
      throw new ValidationError('Payment amount must be greater than 0.');
    }

    const currentBalance = roundCurrency(Number(invoice.balance_due));
    if (paymentAmount > currentBalance + 0.01) {
      throw new ValidationError(`Payment amount (₹${paymentAmount}) cannot exceed remaining invoice balance (₹${currentBalance}).`);
    }

    // 2. Generate Payment Number if not provided
    const paymentNumber = payload.payment_number || (await this.getNextPaymentNumber(payload.organization_id));

    // 3. Insert Payment
    const { data: payment, error: payError } = await (supabase.from('payments' as any) as any)
      .insert({
        ...payload,
        amount: paymentAmount,
        customer_id: invoice.customer_id,
        payment_number: paymentNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (payError || !payment) {
      throw new DatabaseError(`Failed to record payment: ${payError?.message}`);
    }

    // 4. Update Invoice balances and status
    const newPaid = roundCurrency(Number(invoice.amount_paid || 0) + paymentAmount);
    const newBalance = Math.max(0, roundCurrency(Number(invoice.total || 0) - newPaid));
    const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';

    await (supabase.from('invoices' as any) as any)
      .update({
        amount_paid: newPaid,
        balance_due: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    // 5. Update Customer paid and outstanding
    const { data: customer } = await (supabase.from('customers' as any) as any)
      .select('paid, outstanding')
      .eq('id', invoice.customer_id)
      .single();

    if (customer) {
      await (supabase.from('customers' as any) as any)
        .update({
          paid: roundCurrency(Number(customer.paid || 0) + paymentAmount),
          outstanding: Math.max(0, roundCurrency(Number(customer.outstanding || 0) - paymentAmount)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.customer_id);
    }

    return this.getById(payment.id, payload.organization_id);
  }

  async delete(id: string, organizationId: string) {
    const supabase = createClient();
    const payment = await this.getById(id, organizationId);

    const paymentAmount = roundCurrency(Number(payment.amount));
    const invoiceId = payment.invoice_id;
    const customerId = payment.customer_id;

    // Delete payment record
    const { error } = await (supabase.from('payments' as any) as any)
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(`Failed to delete payment: ${error.message}`);
    }

    // Revert invoice balance
    const { data: invoice } = await (supabase.from('invoices' as any) as any)
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoice) {
      const newPaid = Math.max(0, roundCurrency(Number(invoice.amount_paid || 0) - paymentAmount));
      const newBalance = roundCurrency(Number(invoice.total || 0) - newPaid);
      const newStatus = newPaid === 0 ? 'sent' : newBalance <= 0 ? 'paid' : 'partially_paid';

      await (supabase.from('invoices' as any) as any)
        .update({
          amount_paid: newPaid,
          balance_due: newBalance,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    }

    // Revert customer balance
    const { data: customer } = await (supabase.from('customers' as any) as any)
      .select('paid, outstanding')
      .eq('id', customerId)
      .single();

    if (customer) {
      await (supabase.from('customers' as any) as any)
        .update({
          paid: Math.max(0, roundCurrency(Number(customer.paid || 0) - paymentAmount)),
          outstanding: roundCurrency(Number(customer.outstanding || 0) + paymentAmount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }

    return true;
  }
}
