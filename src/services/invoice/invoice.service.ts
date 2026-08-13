import { InvoiceRepository, InvoiceQueryOptions } from '@/repositories/invoice.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Invoice, InvoiceCreateInput } from '@/types/invoice';
import { DocumentItem } from '@/types/quote';

export class InvoiceService {
  private repo = new InvoiceRepository();

  private mapRowToInvoice(row: any): Invoice {
    const items: DocumentItem[] = (row.items || []).map((item: any) => ({
      id: item.id,
      itemId: item.item_id || undefined,
      name: item.description,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit: 'pcs',
      rate: Number(item.unit_price) || 0,
      discount: Number(item.discount) || 0,
      taxRate: Number(item.tax_rate) || 0,
      amount: Number(item.line_total) || 0,
    }));

    const customer = row.customer ? {
      id: row.customer.id,
      displayName: row.customer.display_name,
      companyName: row.customer.company_name,
      email: row.customer.email,
    } : undefined;

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      customerName: customer?.displayName || customer?.companyName || 'Unknown Customer',
      customerEmail: customer?.email || '',
      quoteId: row.quote_id || undefined,
      date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : '',
      dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
      status: row.status,
      subtotal: Number(row.subtotal) || 0,
      discountTotal: Number(row.discount) || 0,
      taxTotal: Number(row.tax) || 0,
      total: Number(row.total) || 0,
      amountPaid: Number(row.amount_paid) || 0,
      amountDue: Number(row.balance_due) || 0,
      notes: row.notes || undefined,
      terms: row.terms || undefined,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listInvoices(context: AuthContext, options: Omit<InvoiceQueryOptions, 'organizationId'>) {
    const res = await this.repo.list({
      organizationId: context.organization.id,
      ...options,
    });

    return {
      data: res.data.map((r: any) => this.mapRowToInvoice(r)),
      total: res.total,
    };
  }

  async getInvoiceById(context: AuthContext, id: string): Promise<Invoice> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToInvoice(row);
  }

  async createInvoice(context: AuthContext, input: InvoiceCreateInput): Promise<Invoice> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const invoiceNumber = input.invoiceNumber || (await this.repo.getNextInvoiceNumber(context.organization.id));

    const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.rate - (item.discount || 0)), 0);
    const tax = input.items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100)), 0);
    const discount = input.discountTotal || 0;
    const total = Math.max(0, subtotal + tax - discount);

    const payload = {
      organization_id: context.organization.id,
      customer_id: input.customerId,
      quote_id: input.quoteId || null,
      invoice_number: invoiceNumber,
      invoice_date: new Date(input.date).toISOString(),
      due_date: new Date(input.dueDate).toISOString(),
      status: input.status || 'sent',
      subtotal,
      discount,
      tax,
      total,
      amount_paid: 0,
      balance_due: total,
      notes: input.notes || null,
      terms: input.terms || null,
      created_by: context.user.id,
      updated_by: context.user.id,
    };

    const items = input.items.map((item) => ({
      item_id: item.itemId || null,
      description: item.name || item.description || '',
      quantity: item.quantity,
      unit_price: item.rate,
      discount: item.discount || 0,
      tax_rate: item.taxRate || 0,
      tax_amount: (item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100),
      line_total: item.amount || (item.quantity * item.rate),
    }));

    const row = await this.repo.create(payload, items);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Invoice', row.id, {
      action: 'invoice.created',
      invoiceNumber,
    });

    return this.mapRowToInvoice(row);
  }

  async updateInvoice(context: AuthContext, id: string, input: Partial<InvoiceCreateInput>): Promise<Invoice> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const existing = await this.repo.getById(id, context.organization.id);

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.customerId) payload.customer_id = input.customerId;
    if (input.date) payload.invoice_date = new Date(input.date).toISOString();
    if (input.dueDate) payload.due_date = new Date(input.dueDate).toISOString();
    if (input.status) payload.status = input.status;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.terms !== undefined) payload.terms = input.terms;

    let itemsPayload: Record<string, any>[] | undefined = undefined;
    if (input.items) {
      const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.rate - (item.discount || 0)), 0);
      const tax = input.items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100)), 0);
      const discount = input.discountTotal || 0;
      const total = Math.max(0, subtotal + tax - discount);
      const amountPaid = Number(existing.amount_paid) || 0;
      const balanceDue = Math.max(0, total - amountPaid);

      payload.subtotal = subtotal;
      payload.tax = tax;
      payload.discount = discount;
      payload.total = total;
      payload.balance_due = balanceDue;

      itemsPayload = input.items.map((item) => ({
        item_id: item.itemId || null,
        description: item.name || item.description || '',
        quantity: item.quantity,
        unit_price: item.rate,
        discount: item.discount || 0,
        tax_rate: item.taxRate || 0,
        tax_amount: (item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100),
        line_total: item.amount || (item.quantity * item.rate),
      }));
    }

    const row = await this.repo.update(id, context.organization.id, payload, itemsPayload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Invoice', id, {
      action: 'invoice.updated',
    });

    return this.mapRowToInvoice(row);
  }

  async deleteInvoice(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin'], context.membership.role);
    await this.repo.delete(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Invoice', id, {
      action: 'invoice.deleted',
    });

    return true;
  }
}
