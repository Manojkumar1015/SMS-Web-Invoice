import { Invoice, InvoiceCreateInput } from '@/types/invoice';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface IInvoiceService {
  getInvoices(params?: FilterParams): Promise<PaginatedResult<Invoice>>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(data: InvoiceCreateInput): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InvoiceCreateInput>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<boolean>;
  duplicateInvoice(id: string): Promise<Invoice>;
  sendInvoice(id: string): Promise<Invoice>;
  cancelInvoice(id: string): Promise<Invoice>;
  getRecentInvoices(limit?: number): Promise<Invoice[]>;
  getOutstandingInvoices(): Promise<Invoice[]>;
  getInvoicesByCustomer(customerId: string): Promise<Invoice[]>;
}

