import { IQuoteService } from '../interfaces/QuoteService';
import { Quote, QuoteCreateInput } from '@/types/quote';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabaseQuoteService implements IQuoteService {
  async getQuotes(params?: FilterParams): Promise<PaginatedResult<Quote>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/v1/quotes?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch quotes: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch quotes');
    }

    return {
      data: json.data || [],
      total: json.meta?.total ?? json.data.length,
      page: json.meta?.page ?? 1,
      pageSize: json.meta?.pageSize ?? 25,
      totalPages: json.meta?.totalPages ?? 1,
    };
  }

  async getQuoteById(id: string): Promise<Quote | null> {
    const res = await fetch(`/api/v1/quotes/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch quote: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async createQuote(data: QuoteCreateInput): Promise<Quote> {
    const res = await fetch('/api/v1/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create quote');
    }
    const json = await res.json();
    return json.data;
  }

  async updateQuote(id: string, data: Partial<QuoteCreateInput>): Promise<Quote> {
    const res = await fetch(`/api/v1/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to update quote');
    }
    const json = await res.json();
    return json.data;
  }

  async deleteQuote(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/quotes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete quote');
    }
    const json = await res.json();
    return !!json.success;
  }

  async duplicateQuote(id: string): Promise<Quote> {
    const original = await this.getQuoteById(id);
    if (!original) throw new Error('Original quote not found');

    const duplicateInput: QuoteCreateInput = {
      quoteNumber: '',
      customerId: original.customerId,
      customerName: original.customerName,
      customerEmail: original.customerEmail,
      date: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: original.subtotal,
      discountTotal: original.discountTotal,
      taxTotal: original.taxTotal,
      total: original.total,
      notes: original.notes,
      terms: original.terms,
      items: original.items.map((item) => ({ ...item })),
    };


    return this.createQuote(duplicateInput);
  }

  async sendQuote(id: string): Promise<Quote> {
    return this.updateQuote(id, { status: 'sent' });
  }

  async convertToInvoice(id: string): Promise<string> {
    const res = await fetch(`/api/v1/quotes/${id}/convert`, {
      method: 'POST',
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to convert quote to invoice');
    }
    const json = await res.json();
    return json.data.invoiceId;
  }
}
