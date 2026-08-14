export type ClassificationType = 'HSN' | 'SAC';

export interface ItemClassification {
  id: string;
  code: string;
  description: string;
  category: string;
  classificationType: ClassificationType;
  relevance?: string;
  isActive: boolean;
  createdAt: string;
}

export type ItemCategory =
  | 'Digital Marketing'
  | 'Graphic Design'
  | 'Video Editing'
  | 'Video Production'
  | 'Animation'
  | 'Photography'
  | 'Social Media'
  | 'Branding'
  | 'Publishing'
  | 'Printing'
  | 'Software'
  | 'Photography Equipment'
  | 'Video Equipment'
  | 'Printing Equipment'
  | 'Other';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Digital Marketing',
  'Graphic Design',
  'Video Editing',
  'Video Production',
  'Animation',
  'Photography',
  'Social Media',
  'Branding',
  'Publishing',
  'Printing',
  'Software',
  'Photography Equipment',
  'Video Equipment',
  'Printing Equipment',
  'Other',
];
