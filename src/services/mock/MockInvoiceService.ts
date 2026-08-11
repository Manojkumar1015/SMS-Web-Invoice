import { IInvoiceService } from '../interfaces/InvoiceService';
import { Invoice, InvoiceCreateInput } from '@/types/invoice';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockInvoices } from '@/data/mockInvoices';

export class MockInvoiceService implements IInvoiceService {
  private invoices: Invoice[] = [...mockInvoices];

  async getInvoices(params?: FilterParams): Promise<PaginatedResult<Invoice>> {
    let result = [...this.invoices];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((inv) => inv.status === params.status);
    }

    if (params?.customerId) {
      result = result.filter((inv) => inv.customerId === params.customerId);
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.find((inv) => inv.id === id) || null;
  }

  async createInvoice(data: InvoiceCreateInput): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-00${Math.floor(10 + Math.random() * 90)}`,
      amountPaid: 0,
      amountDue: data.total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.invoices.unshift(newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: string, data: Partial<InvoiceCreateInput>): Promise<Invoice> {
    const index = this.invoices.findIndex((inv) => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');

    const current = this.invoices[index];
    const total = data.total ?? current.total;
    const amountPaid = current.amountPaid;
    const amountDue = total - amountPaid;

    let status = data.status ?? current.status;
    if (amountPaid >= total && total > 0) {
      status = 'paid';
    } else if (amountPaid > 0 && amountPaid < total) {
      status = 'partially_paid';
    }

    const updated: Invoice = {
      ...current,
      ...data,
      total,
      amountPaid,
      amountDue,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.invoices[index] = updated;
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const len = this.invoices.length;
    this.invoices = this.invoices.filter((inv) => inv.id !== id);
    return this.invoices.length < len;
  }

  async getRecentInvoices(limit = 5): Promise<Invoice[]> {
    return [...this.invoices].slice(0, limit);
  }

  async getOutstandingInvoices(): Promise<Invoice[]> {
    return this.invoices.filter(
      (inv) => inv.status === 'overdue' || inv.status === 'sent' || inv.status === 'partially_paid'
    );
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return this.invoices.filter((inv) => inv.customerId === customerId);
  }
}
