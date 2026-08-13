import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/api/errors';

export interface ItemQueryOptions {
  organizationId: string;
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ItemRepository {
  async list(options: ItemQueryOptions) {
    const supabase = createClient();
    const { organizationId, search, category, isActive = true, page = 1, pageSize = 25, sortField = 'created_at', sortOrder = 'desc' } = options;

    let query = (supabase.from('items' as any) as any)
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},item_code.ilike.${term},sku.ilike.${term},category.ilike.${term},hsn_sac_code.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch items: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('items' as any) as any)
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Item with ID ${id} not found.`);
    }

    return data;
  }

  async create(payload: Record<string, any>) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('items' as any) as any)
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create item: ${error.message}`);
    }

    return data;
  }

  async update(id: string, organizationId: string, payload: Record<string, any>) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('items' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update item: ${error.message}`);
    }

    return data;
  }

  async archive(id: string, organizationId: string) {
    return this.update(id, organizationId, { is_active: false });
  }

  async getNextItemCode(organizationId: string): Promise<string> {
    const supabase = createClient();
    const { count } = await (supabase.from('items' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const nextNum = (count || 0) + 1;
    return `ITEM-${String(nextNum).padStart(5, '0')}`;
  }
}
