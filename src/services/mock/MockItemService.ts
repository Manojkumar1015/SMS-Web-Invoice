import { IItemService } from '../interfaces/ItemService';
import { Item, ItemCreateInput } from '@/types/item';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockItems } from '@/data/mockItems';

export class MockItemService implements IItemService {
  private items: Item[] = [...mockItems];

  async getItems(params?: FilterParams): Promise<PaginatedResult<Item>> {
    let result = [...this.items];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    if (params?.type && params.type !== 'all') {
      result = result.filter((i) => i.type === params.type);
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((i) => i.status === params.status);
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getItemById(id: string): Promise<Item | null> {
    return this.items.find((i) => i.id === id) || null;
  }

  async createItem(data: ItemCreateInput): Promise<Item> {
    const newItem: Item = {
      ...data,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.unshift(newItem);
    return newItem;
  }

  async updateItem(id: string, data: Partial<ItemCreateInput>): Promise<Item> {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Item not found');

    const updated = {
      ...this.items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.items[index] = updated;
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    const len = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return this.items.length < len;
  }
}
