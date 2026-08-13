import { IInvoiceService } from '../interfaces/InvoiceService';
import { Invoice, InvoiceCreateInput } from '@/types/invoice';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabaseInvoiceService implements IInvoiceService {
  async getInvoices(params?: FilterParams): Promise<PaginatedResult<Invoice>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/v1/invoices?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch invoices: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch invoices');
    }

    return {
      data: json.data || [],
      total: json.meta?.total ?? json.data.length,
      page: json.meta?.page ?? 1,
      pageSize: json.meta?.pageSize ?? 25,
      totalPages: json.meta?.totalPages ?? 1,
    };
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const res = await fetch(`/api/v1/invoices/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch invoice: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async createInvoice(data: InvoiceCreateInput): Promise<Invoice> {
    const res = await fetch('/api/v1/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create invoice');
    }
    const json = await res.json();
    return json.data;
  }

  async updateInvoice(id: string, data: Partial<InvoiceCreateInput>): Promise<Invoice> {
    const res = await fetch(`/api/v1/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to update invoice');
    }
    const json = await res.json();
    return json.data;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete invoice');
    }
    const json = await res.json();
    return !!json.success;
  }

  async duplicateInvoice(id: string): Promise<Invoice> {
    const original = await this.getInvoiceById(id);
    if (!original) throw new Error('Original invoice not found');

    const duplicateInput: InvoiceCreateInput = {
      customerId: original.customerId,
      customerName: original.customerName,
      customerEmail: original.customerEmail,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: original.subtotal,
      discountTotal: original.discountTotal,
      taxTotal: original.taxTotal,
      total: original.total,
      notes: original.notes,
      terms: original.terms,
      items: original.items.map((item) => ({ ...item })),
    };

    return this.createInvoice(duplicateInput);
  }

  async sendInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: 'sent' });
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: 'cancelled' });
  }

  async getRecentInvoices(limit?: number): Promise<Invoice[]> {
    const res = await this.getInvoices({ pageSize: limit || 5 });
    return res.data;
  }

  async getOutstandingInvoices(): Promise<Invoice[]> {
    const res = await this.getInvoices({ pageSize: 50 });
    return res.data.filter((inv) => inv.amountDue > 0);
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    const res = await this.getInvoices({ pageSize: 100 });
    return res.data.filter((inv) => inv.customerId === customerId);
  }
}
