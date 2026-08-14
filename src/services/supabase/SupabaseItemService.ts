import { IItemService } from '../interfaces/ItemService';
import { Item, ItemCreateInput } from '@/types/item';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabaseItemService implements IItemService {
  async getItems(params?: FilterParams): Promise<PaginatedResult<Item>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.status && params.status !== 'all') {
      query.set('is_active', params.status === 'active' ? 'true' : 'false');
    }
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/v1/items?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch items: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch items');
    }

    return {
      data: json.data || [],
      total: json.meta?.total ?? json.data.length,
      page: json.meta?.page ?? 1,
      pageSize: json.meta?.pageSize ?? 25,
      totalPages: json.meta?.totalPages ?? 1,
    };
  }

  async getItemById(id: string): Promise<Item | null> {
    const res = await fetch(`/api/v1/items/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch item: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async createItem(data: ItemCreateInput): Promise<Item> {
    const res = await fetch('/api/v1/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create item');
    }
    const json = await res.json();
    return json.data;
  }

  async updateItem(id: string, data: Partial<ItemCreateInput>): Promise<Item> {
    const res = await fetch(`/api/v1/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to update item');
    }
    const json = await res.json();
    return json.data;
  }

  async deleteItem(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Failed to delete item (${res.status} ${res.statusText})`);
    }
    const json = await res.json();
    return !!json.success;
  }
}
