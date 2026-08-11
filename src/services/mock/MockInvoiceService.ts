import { IInvoiceService } from '../interfaces/InvoiceService';
import { Invoice, InvoiceCreateInput } from '@/types/invoice';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockInvoices } from '@/data/mockInvoices';

export class MockInvoiceService implements IInvoiceService {
  private invoices: Invoice[] = [...mockInvoices];

  async getInvoices(params?: FilterParams & { dateStart?: string; dateEnd?: string; minAmount?: number; maxAmount?: number; sortBy?: string; paymentStatus?: string }): Promise<PaginatedResult<Invoice>> {
    let result = [...this.invoices];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(q)) ||
          (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((inv) => inv.status === params.status);
    }

    if (params?.paymentStatus && params.paymentStatus !== 'all') {
      if (params.paymentStatus === 'unpaid') {
        result = result.filter((inv) => inv.amountPaid === 0);
      } else if (params.paymentStatus === 'partially_paid') {
        result = result.filter((inv) => inv.amountPaid > 0 && inv.amountDue > 0);
      } else if (params.paymentStatus === 'paid') {
        result = result.filter((inv) => inv.amountDue === 0);
      }
    }

    if (params?.customerId) {
      result = result.filter((inv) => inv.customerId === params.customerId);
    }

    if (params?.dateStart) {
      result = result.filter((inv) => inv.date >= params.dateStart!);
    }

    if (params?.dateEnd) {
      result = result.filter((inv) => inv.date <= params.dateEnd!);
    }

    if (params?.minAmount !== undefined && !isNaN(params.minAmount)) {
      result = result.filter((inv) => inv.total >= params.minAmount!);
    }

    if (params?.maxAmount !== undefined && !isNaN(params.maxAmount)) {
      result = result.filter((inv) => inv.total <= params.maxAmount!);
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
      } else if (params.sortBy === 'due_desc') {
        result.sort((a, b) => b.amountDue - a.amountDue);
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

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.find((inv) => inv.id === id) || null;
  }

  async createInvoice(data: InvoiceCreateInput): Promise<Invoice> {
    const nextNum = 100 + this.invoices.length + 1;
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-00${nextNum}`,
      amountPaid: 0,
      amountDue: data.total,
      activities: [
        {
          id: `iact-${Date.now()}`,
          title: 'Invoice Created',
          description: `Invoice drafted in system`,
          timestamp: new Date().toISOString(),
          actor: 'Current User',
          type: 'created',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.invoices.unshift(newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: string, data: Partial<InvoiceCreateInput & { amountPaid?: number }>): Promise<Invoice> {
    const index = this.invoices.findIndex((inv) => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');

    const current = this.invoices[index];
    const total = data.total ?? current.total;
    const amountPaid = data.amountPaid !== undefined ? data.amountPaid : current.amountPaid;
    const amountDue = Math.max(0, total - amountPaid);

    let status = data.status ?? current.status;
    if (status !== 'cancelled') {
      if (amountPaid >= total && total > 0) {
        status = 'paid';
      } else if (amountPaid > 0 && amountPaid < total) {
        status = 'partially_paid';
      }
    }

    const updatedActivities = [...(current.activities || [])];
    if (data.amountPaid !== undefined && data.amountPaid > current.amountPaid) {
      const addedPaid = data.amountPaid - current.amountPaid;
      updatedActivities.push({
        id: `iact-${Date.now()}`,
        title: 'Payment Recorded',
        description: `Payment of ₹${addedPaid.toLocaleString('en-IN')} recorded`,
        timestamp: new Date().toISOString(),
        actor: 'Current User',
        type: 'payment_received',
      });
    }

    const updated: Invoice = {
      ...current,
      ...data,
      total,
      amountPaid,
      amountDue,
      status,
      activities: updatedActivities,
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

  async duplicateInvoice(id: string): Promise<Invoice> {
    const existing = await this.getInvoiceById(id);
    if (!existing) throw new Error('Invoice not found');

    const nextNum = 100 + this.invoices.length + 1;
    const duplicated: Invoice = {
      ...existing,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-00${nextNum}`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      amountPaid: 0,
      amountDue: existing.total,
      activities: [
        {
          id: `iact-${Date.now()}`,
          title: 'Invoice Duplicated',
          description: `Duplicated from ${existing.invoiceNumber}`,
          timestamp: new Date().toISOString(),
          actor: 'Current User',
          type: 'created',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.invoices.unshift(duplicated);
    return duplicated;
  }

  async sendInvoice(id: string): Promise<Invoice> {
    const existing = await this.getInvoiceById(id);
    if (!existing) throw new Error('Invoice not found');

    return this.updateInvoice(id, {
      status: 'sent',
    });
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    const existing = await this.getInvoiceById(id);
    if (!existing) throw new Error('Invoice not found');

    return this.updateInvoice(id, {
      status: 'cancelled',
    });
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
