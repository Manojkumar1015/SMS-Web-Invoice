import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/api/errors';

export interface QuoteQueryOptions {
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

export class QuoteRepository {
  async list(options: QuoteQueryOptions) {
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

    let query = (supabase.from('quotes' as any) as any)
      .select('*, customer:customers(id, display_name, company_name, email), items:quote_items(*)', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`quote_number.ilike.${term},notes.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch quotes: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('quotes' as any) as any)
      .select('*, customer:customers(*), items:quote_items(*)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Quote with ID ${id} not found.`);
    }

    return data;
  }

  async getNextQuoteNumber(organizationId: string): Promise<string> {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('generate_next_number', {
      _org_id: organizationId,
      _entity_type: 'quote',
      _default_prefix: 'QUO-',
    });

    if (!error && data) {
      return data;
    }

    // Fallback if RPC function not executed yet
    const { count } = await (supabase.from('quotes' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const nextNum = (count || 0) + 1;
    return `QUO-${String(nextNum).padStart(5, '0')}`;
  }

  async create(payload: Record<string, any>, items: Record<string, any>[]) {
    const supabase = createClient();

    const { data: quote, error: quoteError } = await (supabase.from('quotes' as any) as any)
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quoteError || !quote) {
      throw new DatabaseError(`Failed to create quote: ${quoteError?.message}`);
    }

    if (items && items.length > 0) {
      const lineItems = items.map((item, index) => ({
        ...item,
        organization_id: payload.organization_id,
        quote_id: quote.id,
        sort_order: index,
      }));

      let { error: itemsError } = await (supabase.from('quote_items' as any) as any).insert(lineItems);
      if (itemsError && (itemsError.message?.toLowerCase().includes('column') || itemsError.code === 'PGRST204')) {
        const legacyLineItems = lineItems.map((item: any) => {
          const { classification_id, classification_code, classification_type, ...rest } = item;
          return rest;
        });
        const retry = await (supabase.from('quote_items' as any) as any).insert(legacyLineItems);
        itemsError = retry.error;
      }

      if (itemsError) {
        throw new DatabaseError(`Failed to create quote items: ${itemsError.message}`);
      }
    }

    return this.getById(quote.id, payload.organization_id);
  }

  async update(id: string, organizationId: string, payload: Record<string, any>, items?: Record<string, any>[]) {
    const supabase = createClient();

    const { error: updateError } = await (supabase.from('quotes' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw new DatabaseError(`Failed to update quote: ${updateError.message}`);
    }

    if (items) {
      // Replace line items
      await (supabase.from('quote_items' as any) as any)
        .delete()
        .eq('quote_id', id)
        .eq('organization_id', organizationId);

      const lineItems = items.map((item, index) => ({
        ...item,
        organization_id: organizationId,
        quote_id: id,
        sort_order: index,
      }));

      const { error: itemsError } = await (supabase.from('quote_items' as any) as any).insert(lineItems);
      if (itemsError) {
        throw new DatabaseError(`Failed to update quote items: ${itemsError.message}`);
      }
    }

    return this.getById(id, organizationId);
  }

  async delete(id: string, organizationId: string) {
    const supabase = createClient();
    const { error } = await (supabase.from('quotes' as any) as any)
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(`Failed to delete quote: ${error.message}`);
    }

    return true;
  }
}
