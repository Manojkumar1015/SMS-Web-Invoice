import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/api/errors';

export interface InvoiceQueryOptions {
  organizationId: string;
  search?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export class InvoiceRepository {
  async list(options: InvoiceQueryOptions) {
    const supabase = createClient();
    const {
      organizationId,
      search,
      status,
      customerId,
      page = 1,
      pageSize = 25,
      sortField = 'created_at',
      sortOrder = 'desc',
    } = options;

    let query = (supabase.from('invoices' as any) as any)
      .select('*, customer:customers(id, display_name, company_name, email), items:invoice_items(*)', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`invoice_number.ilike.${term},notes.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch invoices: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('invoices' as any) as any)
      .select('*, customer:customers(*), items:invoice_items(*), payments(*)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Invoice with ID ${id} not found.`);
    }

    return data;
  }

  async getNextInvoiceNumber(organizationId: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('generate_next_number', {
      _org_id: organizationId,
      _entity_type: 'invoice',
      _default_prefix: 'INV-',
    });

    if (!error && data) {
      return data;
    }

    const { count } = await (supabase.from('invoices' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const nextNum = (count || 0) + 1;
    return `INV-${String(nextNum).padStart(5, '0')}`;
  }

  async create(payload: Record<string, any>, items: Record<string, any>[]) {
    const supabase = createClient();

    const { data: invoice, error: invoiceError } = await (supabase.from('invoices' as any) as any)
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      throw new DatabaseError(`Failed to create invoice: ${invoiceError?.message}`);
    }

    if (items && items.length > 0) {
      const lineItems = items.map((item, index) => ({
        ...item,
        organization_id: payload.organization_id,
        invoice_id: invoice.id,
        sort_order: index,
      }));

      let { error: itemsError } = await (supabase.from('invoice_items' as any) as any).insert(lineItems);
      if (itemsError && (itemsError.message?.toLowerCase().includes('column') || itemsError.code === 'PGRST204')) {
        const legacyLineItems = lineItems.map((item: any) => {
          const { classification_id, classification_code, classification_type, ...rest } = item;
          return rest;
        });
        const retry = await (supabase.from('invoice_items' as any) as any).insert(legacyLineItems);
        itemsError = retry.error;
      }

      if (itemsError) {
        throw new DatabaseError(`Failed to create invoice items: ${itemsError.message}`);
      }
    }

    // Update customer outstanding & total invoiced
    const total = Number(payload.total) || 0;
    if (payload.customer_id) {
      const { data: customer } = await (supabase.from('customers' as any) as any)
        .select('total_invoiced, outstanding')
        .eq('id', payload.customer_id)
        .single();

      if (customer) {
        await (supabase.from('customers' as any) as any)
          .update({
            total_invoiced: Number(customer.total_invoiced || 0) + total,
            outstanding: Number(customer.outstanding || 0) + total,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.customer_id);
      }
    }

    return this.getById(invoice.id, payload.organization_id);
  }

  async update(id: string, organizationId: string, payload: Record<string, any>, items?: Record<string, any>[]) {
    const supabase = createClient();

    const { error: updateError } = await (supabase.from('invoices' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw new DatabaseError(`Failed to update invoice: ${updateError.message}`);
    }

    if (items) {
      await (supabase.from('invoice_items' as any) as any)
        .delete()
        .eq('invoice_id', id)
        .eq('organization_id', organizationId);

      const lineItems = items.map((item, index) => ({
        ...item,
        organization_id: organizationId,
        invoice_id: id,
        sort_order: index,
      }));

      const { error: itemsError } = await (supabase.from('invoice_items' as any) as any).insert(lineItems);
      if (itemsError) {
        throw new DatabaseError(`Failed to update invoice items: ${itemsError.message}`);
      }
    }

    return this.getById(id, organizationId);
  }

  async delete(id: string, organizationId: string) {
    const supabase = createClient();
    const { error } = await (supabase.from('invoices' as any) as any)
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(`Failed to delete invoice: ${error.message}`);
    }

    return true;
  }
}
