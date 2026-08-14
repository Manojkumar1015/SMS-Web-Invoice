import { ItemClassification } from './classification';

export type ItemType = 'Product' | 'Service' | 'product' | 'service';
export type ItemStatus = 'active' | 'inactive';

export interface Item {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  itemType?: 'Product' | 'Service';
  category?: string;
  description?: string;
  unit: string; // e.g., "pcs", "hrs", "box", "month"
  sellingPrice: number;
  purchasePrice?: number;
  taxRate: number; // percentage, e.g., 18 for 18% GST
  hsnSac?: string;
  classificationId?: string;
  classification?: ItemClassification;
  discountRate?: number; // default discount percentage
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type ItemCreateInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

