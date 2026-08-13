import { ItemRepository, ItemQueryOptions } from '@/repositories/item.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Item, ItemCreateInput } from '@/types/item';

export class ItemService {
  private repo = new ItemRepository();

  private mapRowToItem(row: any): Item {
    return {
      id: row.id,
      name: row.name,
      sku: row.sku || row.item_code,
      type: row.type || 'product',
      description: row.description || undefined,
      unit: row.unit || 'pcs',
      sellingPrice: Number(row.selling_price) || 0,
      purchasePrice: row.cost_price ? Number(row.cost_price) : undefined,
      taxRate: row.tax_rate !== null ? Number(row.tax_rate) : 18,
      hsnSac: row.hsn_sac_code || undefined,
      discountRate: row.discount_rate !== null ? Number(row.discount_rate) : undefined,
      status: row.is_active ? 'active' : 'inactive',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listItems(context: AuthContext, options: Omit<ItemQueryOptions, 'organizationId'>) {
    const res = await this.repo.list({
      organizationId: context.organization.id,
      ...options,
    });

    return {
      data: res.data.map(this.mapRowToItem),
      total: res.total,
    };
  }

  async getItemById(context: AuthContext, id: string): Promise<Item> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToItem(row);
  }

  async createItem(context: AuthContext, input: ItemCreateInput): Promise<Item> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const itemCode = await this.repo.getNextItemCode(context.organization.id);

    const payload = {
      organization_id: context.organization.id,
      item_code: itemCode,
      name: input.name,
      sku: input.sku || itemCode,
      type: input.type || 'product',
      description: input.description || null,
      unit: input.unit || 'pcs',
      selling_price: input.sellingPrice,
      cost_price: input.purchasePrice ?? 0,
      tax_type: 'GST',
      tax_rate: input.taxRate ?? 18,
      hsn_sac_code: input.hsnSac || null,
      discount_rate: input.discountRate ?? 0,
      is_active: input.status !== 'inactive',
      created_by: context.user.id,
      updated_by: context.user.id,
    };

    const row = await this.repo.create(payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Item', row.id, {
      action: 'item.created',
      itemCode,
    });

    return this.mapRowToItem(row);
  }

  async updateItem(context: AuthContext, id: string, input: Partial<ItemCreateInput>): Promise<Item> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.name !== undefined) payload.name = input.name;
    if (input.sku !== undefined) payload.sku = input.sku;
    if (input.type !== undefined) payload.type = input.type;
    if (input.description !== undefined) payload.description = input.description;
    if (input.unit !== undefined) payload.unit = input.unit;
    if (input.sellingPrice !== undefined) payload.selling_price = input.sellingPrice;
    if (input.purchasePrice !== undefined) payload.cost_price = input.purchasePrice;
    if (input.taxRate !== undefined) payload.tax_rate = input.taxRate;
    if (input.hsnSac !== undefined) payload.hsn_sac_code = input.hsnSac;
    if (input.discountRate !== undefined) payload.discount_rate = input.discountRate;
    if (input.status !== undefined) payload.is_active = input.status === 'active';

    const row = await this.repo.update(id, context.organization.id, payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Item', id, {
      action: 'item.updated',
    });

    return this.mapRowToItem(row);
  }

  async archiveItem(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    await this.repo.archive(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Item', id, {
      action: 'item.archived',
    });

    return true;
  }
}
