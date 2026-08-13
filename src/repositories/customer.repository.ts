import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/api/errors';

export interface CustomerQueryOptions {
  organizationId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomerRepository {
  async list(options: CustomerQueryOptions) {
    const supabase = createClient();
    const { organizationId, search, isActive, page = 1, pageSize = 25, sortField = 'created_at', sortOrder = 'desc' } = options;

    let query = (supabase.from('customers' as any) as any)
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`display_name.ilike.${term},company_name.ilike.${term},customer_number.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch customers: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('customers' as any) as any)
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Customer with ID ${id} not found.`);
    }

    return data;
  }

  async create(payload: Record<string, any>) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('customers' as any) as any)
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create customer: ${error.message}`);
    }

    return data;
  }

  async update(id: string, organizationId: string, payload: Record<string, any>) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('customers' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update customer: ${error.message}`);
    }

    return data;
  }

  async archive(id: string, organizationId: string) {
    return this.update(id, organizationId, { is_active: false });
  }

  async getNextCustomerNumber(organizationId: string): Promise<string> {
    const supabase = createClient();
    const { count } = await (supabase.from('customers' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const nextNum = (count || 0) + 1;
    return `CUS-${String(nextNum).padStart(5, '0')}`;
  }
}
