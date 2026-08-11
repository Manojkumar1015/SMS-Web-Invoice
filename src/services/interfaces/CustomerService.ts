import { Customer, CustomerCreateInput } from '@/types/customer';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface ICustomerService {
  getCustomers(params?: FilterParams): Promise<PaginatedResult<Customer>>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(data: CustomerCreateInput): Promise<Customer>;
  updateCustomer(id: string, data: Partial<CustomerCreateInput>): Promise<Customer>;
  deleteCustomer(id: string): Promise<boolean>;
  getTopCustomers(limit?: number): Promise<Customer[]>;
}
