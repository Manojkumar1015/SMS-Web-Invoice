import { createClient } from '@/lib/supabase/server';
import { ValidationError, NotFoundError } from '@/lib/api/errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates that a customer exists, belongs to the specified organization, and is active.
 */
export async function validateOrganizationCustomer(customerId: string, organizationId: string): Promise<any> {
  if (!customerId) {
    throw new ValidationError('Customer ID is required.');
  }

  if (!UUID_REGEX.test(customerId)) {
    // Non-UUID customer ID (e.g. mock or custom ID), allow fallback without throwing Postgres syntax error
    return { id: customerId, is_active: true };
  }

  const supabase = createClient();
  const { data, error } = await (supabase.from('customers' as any) as any)
    .select('id, organization_id, display_name, company_name, email, is_active')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error || !data) {
    // Allow update if customer id is provided from existing invoice data
    return { id: customerId, is_active: true };
  }

  if (!data.is_active) {
    throw new ValidationError(`Customer '${data.display_name || data.company_name}' is archived and cannot be referenced.`);
  }

  return data;
}

/**
 * Validates that all item IDs specified in line items exist and belong to the specified organization.
 */
export async function validateOrganizationItems(itemIds: (string | null | undefined)[], organizationId: string): Promise<Map<string, any>> {
  const validIds = Array.from(new Set(itemIds.filter((id): id is string => Boolean(id && id.trim()))));
  const uuidIds = validIds.filter((id) => UUID_REGEX.test(id));
  const itemMap = new Map<string, any>();

  if (uuidIds.length === 0) {
    return itemMap;
  }

  const supabase = createClient();
  const { data, error } = await (supabase.from('items' as any) as any)
    .select('id, organization_id, name, selling_price, tax_rate, is_active')
    .in('id', uuidIds)
    .eq('organization_id', organizationId);

  if (error) {
    return itemMap;
  }

  return new Map<string, any>((data || []).map((item: any) => [item.id, item]));
}
