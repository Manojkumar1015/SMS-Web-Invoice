import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError } from '@/lib/api/errors';

export class TemplateRepository {
  async list(organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('invoice_templates' as any) as any)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  async getById(id: string, organizationId: string) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('invoice_templates' as any) as any)
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Template with ID ${id} not found.`);
    }

    return data;
  }

  async getDefault(organizationId: string) {
    const supabase = createClient();
    const { data } = await (supabase.from('invoice_templates' as any) as any)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    return data || null;
  }

  async create(payload: Record<string, any>) {
    const supabase = createClient();

    if (payload.is_default) {
      // Unset previous defaults
      await (supabase.from('invoice_templates' as any) as any)
        .update({ is_default: false })
        .eq('organization_id', payload.organization_id);
    }

    const { data, error } = await (supabase.from('invoice_templates' as any) as any)
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create template: ${error.message}`);
    }

    return data;
  }

  async update(id: string, organizationId: string, payload: Record<string, any>) {
    const supabase = createClient();

    if (payload.is_default) {
      await (supabase.from('invoice_templates' as any) as any)
        .update({ is_default: false })
        .eq('organization_id', organizationId);
    }

    const { data, error } = await (supabase.from('invoice_templates' as any) as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update template: ${error.message}`);
    }

    return data;
  }

  async delete(id: string, organizationId: string) {
    const supabase = createClient();
    const { error } = await (supabase.from('invoice_templates' as any) as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(`Failed to archive template: ${error.message}`);
    }

    return true;
  }
}
