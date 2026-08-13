import { InvoiceRepository, InvoiceQueryOptions } from '@/repositories/invoice.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Invoice, InvoiceCreateInput } from '@/types/invoice';
import { DocumentItem } from '@/types/quote';
import { calculateDocumentTotals, roundCurrency } from '@/lib/financial';
import { validateOrganizationCustomer, validateOrganizationItems } from '@/lib/api/tenantValidation';

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

    // Multi-tenant customer & item ownership validation
    await validateOrganizationCustomer(input.customerId, context.organization.id);
    await validateOrganizationItems(input.items.map((i) => i.itemId), context.organization.id);

    const invoiceNumber = input.invoiceNumber && input.invoiceNumber.trim()
      ? input.invoiceNumber.trim()
      : await this.repo.getNextInvoiceNumber(context.organization.id);

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

    const invoiceDate = input.invoiceDate || input.date || new Date().toISOString().split('T')[0];
    const dueDate = input.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const amountPaid = 0;
    const balanceDue = computed.total;

    // Derive authoritative status if not explicitly provided
    let status = input.status || 'sent';
    if (balanceDue === 0 && computed.total > 0) {
      status = 'paid';
    } else if (new Date(dueDate) < new Date() && balanceDue > 0) {
      status = 'overdue';
    }

    const payload = {
      organization_id: context.organization.id,
      customer_id: input.customerId,
      quote_id: input.quoteId || null,
      invoice_number: invoiceNumber,
      invoice_date: new Date(invoiceDate).toISOString(),
      due_date: new Date(dueDate).toISOString(),
      status,
      subtotal: computed.subtotal,
      discount: computed.discountTotal,
      tax: computed.taxTotal,
      total: computed.total,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      notes: input.notes || null,
      terms: input.terms || null,
      template_id: input.templateId || null,
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

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Invoice', row.id, {
      action: 'invoice.created',
      invoiceNumber,
    });

    return this.mapRowToInvoice(row);
  }

  async updateInvoice(context: AuthContext, id: string, input: Partial<InvoiceCreateInput>): Promise<Invoice> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const existing = await this.repo.getById(id, context.organization.id);

    if (input.customerId) {
      await validateOrganizationCustomer(input.customerId, context.organization.id);
    }

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.customerId) payload.customer_id = input.customerId;
    const invDateStr = input.invoiceDate || input.date;
    if (invDateStr) {
      const d = new Date(invDateStr);
      if (!isNaN(d.getTime())) payload.invoice_date = d.toISOString();
    }
    if (input.dueDate) {
      const d = new Date(input.dueDate);
      if (!isNaN(d.getTime())) payload.due_date = d.toISOString();
    }
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.terms !== undefined) payload.terms = input.terms;
    if (input.templateId !== undefined) payload.template_id = input.templateId;

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

      const amountPaid = Number(existing.amount_paid) || 0;
      const balanceDue = Math.max(0, roundCurrency(computed.total - amountPaid));

      payload.subtotal = computed.subtotal;
      payload.tax = computed.taxTotal;
      payload.discount = computed.discountTotal;
      payload.total = computed.total;
      payload.balance_due = balanceDue;

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

    // Determine derived status if not explicitly passed
    if (input.status) {
      payload.status = input.status;
    } else if (payload.balance_due !== undefined) {
      const currentPaid = Number(existing.amount_paid) || 0;
      const currentTotal = payload.total !== undefined ? payload.total : Number(existing.total);
      if (payload.balance_due === 0 && currentTotal > 0) {
        payload.status = 'paid';
      } else if (currentPaid > 0 && currentPaid < currentTotal) {
        payload.status = 'partially_paid';
      }
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
