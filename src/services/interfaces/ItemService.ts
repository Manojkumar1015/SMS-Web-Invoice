import { Item, ItemCreateInput } from '@/types/item';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface IItemService {
  getItems(params?: FilterParams): Promise<PaginatedResult<Item>>;
  getItemById(id: string): Promise<Item | null>;
  createItem(data: ItemCreateInput): Promise<Item>;
  updateItem(id: string, data: Partial<ItemCreateInput>): Promise<Item>;
  deleteItem(id: string): Promise<boolean>;
}
