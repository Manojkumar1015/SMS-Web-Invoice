import { ICustomerService } from '../interfaces/CustomerService';
import { Customer, CustomerCreateInput } from '@/types/customer';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockCustomers } from '@/data/mockCustomers';

export class MockCustomerService implements ICustomerService {
  private customers: Customer[] = [...mockCustomers];

  async getCustomers(params?: FilterParams): Promise<PaginatedResult<Customer>> {
    let result = [...this.customers];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.displayName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((c) => c.status === params.status);
    }

    if (params?.sortBy) {
      const key = params.sortBy as keyof Customer;
      const order = params.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customers.find((c) => c.id === id) || null;
  }

  async createCustomer(data: CustomerCreateInput): Promise<Customer> {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      totalInvoiced: 0,
      paid: 0,
      outstanding: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, data: Partial<CustomerCreateInput>): Promise<Customer> {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Customer not found');

    const updated = {
      ...this.customers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.customers[index] = updated;
    return updated;
  }

  async deleteCustomer(id: string): Promise<{ success: boolean; mode?: 'deleted' | 'archived'; message?: string }> {
    const len = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id);
    const deleted = this.customers.length < len;
    return {
      success: deleted,
      mode: 'deleted',
      message: deleted ? 'Customer deleted successfully.' : 'Customer not found.',
    };
  }

  async getTopCustomers(limit = 5): Promise<Customer[]> {
    return [...this.customers]
      .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
      .slice(0, limit);
  }
}
