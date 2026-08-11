import { IQuoteService } from '../interfaces/QuoteService';
import { Quote, QuoteCreateInput } from '@/types/quote';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockQuotes } from '@/data/mockQuotes';
import { invoiceService } from '../index';

export class MockQuoteService implements IQuoteService {
  private quotes: Quote[] = [...mockQuotes];

  async getQuotes(params?: FilterParams & { dateStart?: string; dateEnd?: string; minAmount?: number; maxAmount?: number; sortBy?: string }): Promise<PaginatedResult<Quote>> {
    let result = [...this.quotes];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (qItem) =>
          qItem.quoteNumber.toLowerCase().includes(q) ||
          qItem.customerName.toLowerCase().includes(q) ||
          (qItem.customerEmail && qItem.customerEmail.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((qItem) => qItem.status === params.status);
    }

    if (params?.customerId) {
      result = result.filter((qItem) => qItem.customerId === params.customerId);
    }

    if (params?.dateStart) {
      result = result.filter((qItem) => qItem.date >= params.dateStart!);
    }

    if (params?.dateEnd) {
      result = result.filter((qItem) => qItem.date <= params.dateEnd!);
    }

    if (params?.minAmount !== undefined && !isNaN(params.minAmount)) {
      result = result.filter((qItem) => qItem.total >= params.minAmount!);
    }

    if (params?.maxAmount !== undefined && !isNaN(params.maxAmount)) {
      result = result.filter((qItem) => qItem.total <= params.maxAmount!);
    }

    if (params?.sortBy) {
      if (params.sortBy === 'date_desc') {
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (params.sortBy === 'date_asc') {
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (params.sortBy === 'amount_desc') {
        result.sort((a, b) => b.total - a.total);
      } else if (params.sortBy === 'amount_asc') {
        result.sort((a, b) => a.total - b.total);
      }
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getQuoteById(id: string): Promise<Quote | null> {
    return this.quotes.find((qItem) => qItem.id === id) || null;
  }

  async createQuote(data: QuoteCreateInput): Promise<Quote> {
    const nextNum = 100 + this.quotes.length + 1;
    const newQuote: Quote = {
      ...data,
      id: `quo-${Date.now()}`,
      quoteNumber: `QUO-00${nextNum}`,
      activities: [
        {
          id: `qact-${Date.now()}`,
          title: 'Quote Created',
          description: `Quote drafted by current user`,
          timestamp: new Date().toISOString(),
          actor: 'Current User',
          type: 'created',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quotes.unshift(newQuote);
    return newQuote;
  }

  async updateQuote(id: string, data: Partial<QuoteCreateInput>): Promise<Quote> {
    const index = this.quotes.findIndex((qItem) => qItem.id === id);
    if (index === -1) throw new Error('Quote not found');

    const current = this.quotes[index];
    const updatedActivities = [...(current.activities || [])];
    if (data.status && data.status !== current.status) {
      updatedActivities.push({
        id: `qact-${Date.now()}`,
        title: `Status Changed to ${data.status}`,
        description: `Quote status updated to ${data.status}`,
        timestamp: new Date().toISOString(),
        actor: 'Current User',
        type: 'updated',
      });
    }

    const updated = {
      ...current,
      ...data,
      activities: updatedActivities,
      updatedAt: new Date().toISOString(),
    };
    this.quotes[index] = updated;
    return updated;
  }

  async deleteQuote(id: string): Promise<boolean> {
    const len = this.quotes.length;
    this.quotes = this.quotes.filter((qItem) => qItem.id !== id);
    return this.quotes.length < len;
  }

  async duplicateQuote(id: string): Promise<Quote> {
    const existing = await this.getQuoteById(id);
    if (!existing) throw new Error('Quote not found');

    const nextNum = 100 + this.quotes.length + 1;
    const duplicated: Quote = {
      ...existing,
      id: `quo-${Date.now()}`,
      quoteNumber: `QUO-00${nextNum}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      activities: [
        {
          id: `qact-${Date.now()}`,
          title: 'Quote Duplicated',
          description: `Duplicated from ${existing.quoteNumber}`,
          timestamp: new Date().toISOString(),
          actor: 'Current User',
          type: 'created',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quotes.unshift(duplicated);
    return duplicated;
  }

  async sendQuote(id: string): Promise<Quote> {
    const existing = await this.getQuoteById(id);
    if (!existing) throw new Error('Quote not found');

    return this.updateQuote(id, {
      status: 'sent',
    });
  }

  async convertToInvoice(id: string): Promise<string> {
    const quote = await this.getQuoteById(id);
    if (!quote) throw new Error('Quote not found');

    // Generate Invoice using InvoiceService
    const createdInvoice = await invoiceService.createInvoice({
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      customerGstin: quote.customerGstin,
      billingAddress: quote.billingAddress,
      shippingAddress: quote.shippingAddress,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTerms: quote.paymentTerms || 'Net 30 Days',
      items: quote.items,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxTotal: quote.taxTotal,
      roundOff: 0,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      status: 'sent',
    });

    // Update Quote status to converted / accepted
    quote.status = 'converted';
    quote.convertedInvoiceId = createdInvoice.id;
    if (!quote.activities) quote.activities = [];
    quote.activities.push({
      id: `qact-${Date.now()}`,
      title: 'Converted to Invoice',
      description: `Converted into Invoice ${createdInvoice.invoiceNumber}`,
      timestamp: new Date().toISOString(),
      actor: 'Current User',
      type: 'converted',
    });

    return createdInvoice.id;
  }
}
