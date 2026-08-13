export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  type?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateStart?: string;
  dateEnd?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'customer' | 'invoice' | 'quote' | 'item' | 'payment' | 'expense';
  url: string;
  status?: string;
}
