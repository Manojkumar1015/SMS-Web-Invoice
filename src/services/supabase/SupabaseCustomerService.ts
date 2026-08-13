import { ICustomerService } from '../interfaces/CustomerService';
import { Customer, CustomerCreateInput } from '@/types/customer';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabaseCustomerService implements ICustomerService {
  async getCustomers(params?: FilterParams): Promise<PaginatedResult<Customer>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('is_active', params.status === 'active' ? 'true' : 'false');
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/v1/customers?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch customers: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch customers');
    }

    return {
      data: json.data || [],
      total: json.meta?.total ?? json.data.length,
      page: json.meta?.page ?? 1,
      pageSize: json.meta?.pageSize ?? 25,
      totalPages: json.meta?.totalPages ?? 1,
    };
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const res = await fetch(`/api/v1/customers/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch customer: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async createCustomer(data: CustomerCreateInput): Promise<Customer> {
    const res = await fetch('/api/v1/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create customer');
    }
    const json = await res.json();
    return json.data;
  }

  async updateCustomer(id: string, data: Partial<CustomerCreateInput>): Promise<Customer> {
    const res = await fetch(`/api/v1/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to update customer');
    }
    const json = await res.json();
    return json.data;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/customers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete customer');
    }
    const json = await res.json();
    return !!json.success;
  }

  async getTopCustomers(limit?: number): Promise<Customer[]> {
    const res = await this.getCustomers({ pageSize: limit || 5 });
    return res.data;
  }
}
