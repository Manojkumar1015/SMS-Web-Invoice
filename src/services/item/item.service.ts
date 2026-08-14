import { ItemRepository, ItemQueryOptions } from '@/repositories/item.repository';
import { ClassificationRepository } from '@/repositories/classification.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Item, ItemCreateInput } from '@/types/item';

export class ItemService {
  private repo = new ItemRepository();
  private classificationRepo = new ClassificationRepository();

  private mapRowToItem(row: any): Item {
    const rawClassification = row.classification;
    const classification = rawClassification
      ? {
          id: rawClassification.id,
          code: rawClassification.code,
          description: rawClassification.description,
          category: rawClassification.category,
          classificationType: rawClassification.classification_type,
          relevance: rawClassification.relevance || undefined,
          isActive: !!rawClassification.is_active,
          createdAt: rawClassification.created_at,
        }
      : undefined;

    const resolvedType = (row.item_type || row.type || 'product') === 'Service' || (row.item_type || row.type || 'product') === 'service' ? 'Service' : 'Product';

    return {
      id: row.id,
      name: row.name,
      sku: row.sku || row.item_code,
      type: resolvedType === 'Service' ? 'service' : 'product',
      itemType: resolvedType,
      category: row.category || undefined,
      description: row.description || undefined,
      unit: row.unit || 'pcs',
      sellingPrice: Number(row.selling_price) || 0,
      purchasePrice: row.cost_price ? Number(row.cost_price) : undefined,
      taxRate: row.tax_rate !== null ? Number(row.tax_rate) : 18,
      hsnSac: classification?.code || row.hsn_sac_code || undefined,
      classificationId: row.classification_id || undefined,
      classification,
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

    const classificationIds = Array.from(
      new Set(res.data.map((r: any) => r.classification_id).filter(Boolean))
    ) as string[];

    let classificationsMap: Record<string, any> = {};
    if (classificationIds.length > 0) {
      try {
        const classifications = await this.classificationRepo.getByIds(classificationIds);
        classificationsMap = Object.fromEntries(classifications.map((c: any) => [c.id, c]));
      } catch {
        // Safe fallback
      }
    }

    const items = res.data.map((r: any) => {
      if (r.classification_id && classificationsMap[r.classification_id]) {
        r.classification = classificationsMap[r.classification_id];
      }
      return this.mapRowToItem(r);
    });

    return {
      data: items,
      total: res.total,
    };
  }

  async getItemById(context: AuthContext, id: string): Promise<Item> {
    const row = await this.repo.getById(id, context.organization.id);
    if (row && row.classification_id && !row.classification) {
      try {
        const classification = await this.classificationRepo.getById(row.classification_id);
        if (classification) {
          row.classification = classification;
        }
      } catch {
        // Safe fallback
      }
    }
    return this.mapRowToItem(row);
  }

  async createItem(context: AuthContext, input: ItemCreateInput): Promise<Item> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const itemCode = await this.repo.getNextItemCode(context.organization.id);

    const resolvedType = input.itemType || (input.type === 'service' ? 'Service' : 'Product');

    const payload = {
      organization_id: context.organization.id,
      item_code: itemCode,
      name: input.name,
      sku: input.sku || itemCode,
      type: resolvedType === 'Service' ? 'service' : 'product',
      item_type: resolvedType,
      category: input.category || null,
      classification_id: input.classificationId || null,
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
    if (input.itemType !== undefined || input.type !== undefined) {
      const typeVal = input.itemType || (input.type === 'service' ? 'Service' : 'Product');
      payload.item_type = typeVal;
      payload.type = typeVal === 'Service' ? 'service' : 'product';
    }
    if (input.category !== undefined) payload.category = input.category || null;
    if (input.classificationId !== undefined) payload.classification_id = input.classificationId || null;
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
    requireRole(['Owner', 'Admin'], context.membership.role);

    await this.repo.archive(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Item', id, {
      action: 'item.archived',
    });

    return true;
  }

  async deleteItem(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin'], context.membership.role);

    await this.repo.delete(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Item', id, {
      action: 'item.deleted',
    });

    return true;
  }
}
