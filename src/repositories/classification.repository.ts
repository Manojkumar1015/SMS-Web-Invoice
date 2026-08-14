import { createClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/api/errors';

export interface ClassificationQueryOptions {
  search?: string;
  type?: 'HSN' | 'SAC';
  category?: string;
}

export class ClassificationRepository {
  async list(options?: ClassificationQueryOptions) {
    const supabase = createClient();
    let query = (supabase.from('item_classifications' as any) as any)
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (options?.type) {
      query = query.eq('classification_type', options.type);
    }

    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    if (options?.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      query = query.or(`code.ilike.${term},description.ilike.${term},category.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return data || [];
  }

  async getById(id: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('item_classifications' as any) as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async getByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const supabase = createClient();
    const { data } = await (supabase.from('item_classifications' as any) as any)
      .select('*')
      .in('id', ids);

    return data || [];
  }
}
