import { createClient } from '@/lib/supabase/server';
import { ValidationError, NotFoundError } from '@/lib/api/errors';

/**
 * Validates that a customer exists, belongs to the specified organization, and is active.
 */
export async function validateOrganizationCustomer(customerId: string, organizationId: string): Promise<any> {
  if (!customerId) {
    throw new ValidationError('Customer ID is required.');
  }

  const supabase = createClient();
  const { data, error } = await (supabase.from('customers' as any) as any)
    .select('id, organization_id, display_name, company_name, email, is_active')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new NotFoundError(`Customer with ID ${customerId} not found or does not belong to your organization.`);
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
  const itemMap = new Map<string, any>();

  if (validIds.length === 0) {
    return itemMap;
  }

  const supabase = createClient();
  const { data, error } = await (supabase.from('items' as any) as any)
    .select('id, organization_id, name, selling_price, tax_rate, is_active')
    .in('id', validIds)
    .eq('organization_id', organizationId);

  if (error) {
    throw new ValidationError(`Failed to validate items: ${error.message}`);
  }

  const foundMap = new Map<string, any>((data || []).map((item: any) => [item.id, item]));

  for (const id of validIds) {
    if (!foundMap.has(id)) {
      throw new NotFoundError(`Item with ID ${id} does not exist or does not belong to your organization.`);
    }
  }

  return foundMap;
}
