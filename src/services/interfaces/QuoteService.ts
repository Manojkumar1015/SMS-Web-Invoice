import { Quote, QuoteCreateInput } from '@/types/quote';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface IQuoteService {
  getQuotes(params?: FilterParams): Promise<PaginatedResult<Quote>>;
  getQuoteById(id: string): Promise<Quote | null>;
  createQuote(data: QuoteCreateInput): Promise<Quote>;
  updateQuote(id: string, data: Partial<QuoteCreateInput>): Promise<Quote>;
  deleteQuote(id: string): Promise<boolean>;
  duplicateQuote(id: string): Promise<Quote>;
  sendQuote(id: string): Promise<Quote>;
  convertToInvoice(id: string): Promise<string>; // returns new invoiceId
}

