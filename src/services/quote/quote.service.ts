import { QuoteRepository, QuoteQueryOptions } from '@/repositories/quote.repository';
import { InvoiceRepository } from '@/repositories/invoice.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Quote, QuoteCreateInput, DocumentItem } from '@/types/quote';
import { calculateDocumentTotals } from '@/lib/financial';
import { validateOrganizationCustomer, validateOrganizationItems } from '@/lib/api/tenantValidation';
import { ValidationError, ConflictError } from '@/lib/api/errors';

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
      convertedInvoiceId: row.converted_to_invoice_id || undefined,
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

    // Multi-tenant customer & item ownership validation
    await validateOrganizationCustomer(input.customerId, context.organization.id);
    await validateOrganizationItems(input.items.map((i) => i.itemId), context.organization.id);

    const quoteNumber = input.quoteNumber && input.quoteNumber.trim()
      ? input.quoteNumber.trim()
      : await this.repo.getNextQuoteNumber(context.organization.id);

    const lineInputs = input.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.rate !== undefined ? item.rate : (item.unitPrice || 0),
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
    }));

    const computed = calculateDocumentTotals({
      items: lineInputs,
      discountTotal: input.discountTotal || input.discount || 0,
    });

    const quoteDate = input.quoteDate || input.date || new Date().toISOString().split('T')[0];
    const validUntil = input.validUntil || input.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const payload = {
      organization_id: context.organization.id,
      customer_id: input.customerId,
      quote_number: quoteNumber,
      quote_date: new Date(quoteDate).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      status: input.status || 'draft',
      subtotal: computed.subtotal,
      discount: computed.discountTotal,
      tax: computed.taxTotal,
      total: computed.total,
      notes: input.notes || null,
      terms: input.terms || null,
      created_by: context.user.id,
      updated_by: context.user.id,
    };

    const itemsPayload = input.items.map((item, idx) => {
      const calc = computed.items[idx];
      return {
        item_id: item.itemId || null,
        description: item.description || item.name || 'Line Item',
        quantity: calc.quantity,
        unit_price: calc.unitPrice,
        discount: calc.discount,
        tax_rate: calc.taxRate,
        tax_amount: calc.taxAmount,
        line_total: calc.lineTotal,
      };
    });

    const row = await this.repo.create(payload, itemsPayload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Quote', row.id, {
      action: 'quote.created',
      quoteNumber,
    });

    return this.mapRowToQuote(row);
  }

  async updateQuote(context: AuthContext, id: string, input: Partial<QuoteCreateInput>): Promise<Quote> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const existingRow = await this.repo.getById(id, context.organization.id);
    if (existingRow.status === 'converted' && input.status !== 'converted') {
      throw new ValidationError('Converted quotes cannot be edited.');
    }

    if (input.customerId) {
      await validateOrganizationCustomer(input.customerId, context.organization.id);
    }

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.customerId) payload.customer_id = input.customerId;
    const quoteDateStr = input.quoteDate || input.date;
    if (quoteDateStr) payload.quote_date = new Date(quoteDateStr).toISOString();
    const validUntilStr = input.validUntil || input.expiryDate;
    if (validUntilStr) payload.valid_until = new Date(validUntilStr).toISOString();
    if (input.status) payload.status = input.status;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.terms !== undefined) payload.terms = input.terms;

    let itemsPayload: Record<string, any>[] | undefined = undefined;
    if (input.items) {
      await validateOrganizationItems(input.items.map((i) => i.itemId), context.organization.id);

      const lineInputs = input.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.rate !== undefined ? item.rate : (item.unitPrice || 0),
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
      }));

      const computed = calculateDocumentTotals({
        items: lineInputs,
        discountTotal: input.discountTotal || input.discount || 0,
      });

      payload.subtotal = computed.subtotal;
      payload.tax = computed.taxTotal;
      payload.discount = computed.discountTotal;
      payload.total = computed.total;

      itemsPayload = input.items.map((item, idx) => {
        const calc = computed.items[idx];
        return {
          item_id: item.itemId || null,
          description: item.description || item.name || 'Line Item',
          quantity: calc.quantity,
          unit_price: calc.unitPrice,
          discount: calc.discount,
          tax_rate: calc.taxRate,
          tax_amount: calc.taxAmount,
          line_total: calc.lineTotal,
        };
      });
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
    if (quoteRow.status === 'converted' || quoteRow.converted_to_invoice_id) {
      throw new ConflictError(`Quote ${quoteRow.quote_number} has already been converted to an invoice.`);
    }

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
      tax_amount: Math.round(((item.quantity * item.rate - item.discount) * (item.taxRate / 100) + Number.EPSILON) * 100) / 100,
      line_total: item.amount,
    }));

    // Create Invoice first
    const createdInvoice = await this.invoiceRepo.create(invoicePayload, invoiceItems);

    // Atomically mark Quote as converted
    await this.repo.update(quoteId, context.organization.id, {
      status: 'converted',
      converted_to_invoice_id: createdInvoice.id,
    });

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Quote', quoteId, {
      action: 'quote.converted',
      invoiceId: createdInvoice.id,
    });

    return createdInvoice.id;
  }
}
