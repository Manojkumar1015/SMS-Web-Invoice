import { IQuoteService } from '../interfaces/QuoteService';
import { Quote, QuoteCreateInput } from '@/types/quote';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockQuotes } from '@/data/mockQuotes';

export class MockQuoteService implements IQuoteService {
  private quotes: Quote[] = [...mockQuotes];

  async getQuotes(params?: FilterParams): Promise<PaginatedResult<Quote>> {
    let result = [...this.quotes];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (qItem) =>
          qItem.quoteNumber.toLowerCase().includes(q) ||
          qItem.customerName.toLowerCase().includes(q)
      );
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((qItem) => qItem.status === params.status);
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
    const newQuote: Quote = {
      ...data,
      id: `quo-${Date.now()}`,
      quoteNumber: `QUO-00${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.quotes.unshift(newQuote);
    return newQuote;
  }

  async updateQuote(id: string, data: Partial<QuoteCreateInput>): Promise<Quote> {
    const index = this.quotes.findIndex((qItem) => qItem.id === id);
    if (index === -1) throw new Error('Quote not found');

    const updated = {
      ...this.quotes[index],
      ...data,
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

  async convertToInvoice(id: string): Promise<string> {
    const quote = await this.getQuoteById(id);
    if (!quote) throw new Error('Quote not found');
    quote.status = 'accepted';
    return `inv-${Date.now()}`;
  }
}
