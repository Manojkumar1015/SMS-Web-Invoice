import { QuoteRepository, QuoteQueryOptions } from '@/repositories/quote.repository';
import { InvoiceRepository } from '@/repositories/invoice.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Quote, QuoteCreateInput, DocumentItem } from '@/types/quote';

export class QuoteService {
  private repo = new QuoteRepository();
  private invoiceRepo = new InvoiceRepository();

  private mapRowToQuote(row: any): Quote {
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
      quoteNumber: row.quote_number,
      customerId: row.customer_id,
      customerName: customer?.displayName || customer?.companyName || 'Unknown Customer',
      customerEmail: customer?.email || '',
      date: row.quote_date ? new Date(row.quote_date).toISOString().split('T')[0] : '',
      expiryDate: row.valid_until ? new Date(row.valid_until).toISOString().split('T')[0] : '',
      status: row.status,
      subtotal: Number(row.subtotal) || 0,
      discountTotal: Number(row.discount) || 0,
      taxTotal: Number(row.tax) || 0,
      total: Number(row.total) || 0,
      notes: row.notes || undefined,
      terms: row.terms || undefined,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listQuotes(context: AuthContext, options: Omit<QuoteQueryOptions, 'organizationId'>) {
    const res = await this.repo.list({
      organizationId: context.organization.id,
      ...options,
    });

    return {
      data: res.data.map((r: any) => this.mapRowToQuote(r)),
      total: res.total,
    };
  }

  async getQuoteById(context: AuthContext, id: string): Promise<Quote> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToQuote(row);
  }

  async createQuote(context: AuthContext, input: QuoteCreateInput): Promise<Quote> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const quoteNumber = input.quoteNumber || (await this.repo.getNextQuoteNumber(context.organization.id));

    const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.rate - (item.discount || 0)), 0);
    const tax = input.items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100)), 0);
    const discount = input.discountTotal || 0;
    const total = Math.max(0, subtotal + tax - discount);

    const payload = {
      organization_id: context.organization.id,
      customer_id: input.customerId,
      quote_number: quoteNumber,
      quote_date: new Date(input.date).toISOString(),
      valid_until: new Date(input.expiryDate).toISOString(),
      status: input.status || 'draft',
      subtotal,
      discount,
      tax,
      total,
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

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Quote', row.id, {
      action: 'quote.created',
      quoteNumber,
    });

    return this.mapRowToQuote(row);
  }

  async updateQuote(context: AuthContext, id: string, input: Partial<QuoteCreateInput>): Promise<Quote> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.customerId) payload.customer_id = input.customerId;
    if (input.date) payload.quote_date = new Date(input.date).toISOString();
    if (input.expiryDate) payload.valid_until = new Date(input.expiryDate).toISOString();
    if (input.status) payload.status = input.status;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.terms !== undefined) payload.terms = input.terms;

    let itemsPayload: Record<string, any>[] | undefined = undefined;
    if (input.items) {
      const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.rate - (item.discount || 0)), 0);
      const tax = input.items.reduce((sum, item) => sum + ((item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100)), 0);
      const discount = input.discountTotal || 0;
      const total = Math.max(0, subtotal + tax - discount);

      payload.subtotal = subtotal;
      payload.tax = tax;
      payload.discount = discount;
      payload.total = total;

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

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Quote', id, {
      action: 'quote.updated',
    });

    return this.mapRowToQuote(row);
  }

  async deleteQuote(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin'], context.membership.role);
    await this.repo.delete(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Quote', id, {
      action: 'quote.deleted',
    });

    return true;
  }

  async convertToInvoice(context: AuthContext, quoteId: string): Promise<string> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const quoteRow = await this.repo.getById(quoteId, context.organization.id);
    const quote = this.mapRowToQuote(quoteRow);

    const invoiceNumber = await this.invoiceRepo.getNextInvoiceNumber(context.organization.id);
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoicePayload = {
      organization_id: context.organization.id,
      customer_id: quote.customerId,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      invoice_date: now.toISOString(),
      due_date: dueDate.toISOString(),
      status: 'sent',
      subtotal: quote.subtotal,
      discount: quote.discountTotal,
      tax: quote.taxTotal,
      total: quote.total,
      amount_paid: 0,
      balance_due: quote.total,
      notes: quote.notes || null,
      terms: quote.terms || null,
      created_by: context.user.id,
      updated_by: context.user.id,
    };

    const invoiceItems = quote.items.map((item) => ({
      item_id: item.itemId || null,
      description: item.name || item.description || '',
      quantity: item.quantity,
      unit_price: item.rate,
      discount: item.discount,
      tax_rate: item.taxRate,
      tax_amount: (item.quantity * item.rate - (item.discount || 0)) * ((item.taxRate || 0) / 100),
      line_total: item.amount,
    }));

    const createdInvoice = await this.invoiceRepo.create(invoicePayload, invoiceItems);

    await this.repo.update(quoteId, context.organization.id, { status: 'converted' });

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Quote', quoteId, {
      action: 'quote.converted',
      invoiceId: createdInvoice.id,
    });

    return createdInvoice.id;
  }
}
