import { createClient } from '@/lib/supabase/server';
import { DatabaseError } from '@/lib/api/errors';

export class OrganizationRepository {
  async getById(id: string) {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('organizations' as any) as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch organization: ${error.message}`);
    }

    return data;
  }

  async update(id: string, payload: Record<string, any>) {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('organizations' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update organization: ${error.message}`);
    }

    return data;
  }
}
