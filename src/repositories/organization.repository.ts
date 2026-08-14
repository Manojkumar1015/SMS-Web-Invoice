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
    let { data, error } = await (supabase
      .from('organizations' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error && (error.message?.toLowerCase().includes('column') || error.code === 'PGRST204')) {
      const { bank_name, account_name, account_number, ifsc_code, branch, ...legacyPayload } = payload;
      const retry = await (supabase
        .from('organizations' as any) as any)
        .update({
          ...legacyPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw new DatabaseError(`Failed to update organization: ${error.message}`);
    }

    return data;
  }
}
