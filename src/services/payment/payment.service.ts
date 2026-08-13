import { PaymentRepository, PaymentQueryOptions } from '@/repositories/payment.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Payment, PaymentCreateInput, PaymentMethod, PaymentStatus } from '@/types/payment';

export class PaymentService {
  private repo = new PaymentRepository();

  private mapRowToPayment(row: any): Payment {
    const customer = row.customer ? {
      id: row.customer.id,
      displayName: row.customer.display_name,
      companyName: row.customer.company_name,
      email: row.customer.email,
    } : undefined;

    const invoice = row.invoice ? {
      id: row.invoice.id,
      invoiceNumber: row.invoice.invoice_number,
      total: Number(row.invoice.total) || 0,
      balanceDue: Number(row.invoice.balance_due) || 0,
    } : undefined;

    const amount = Number(row.amount) || 0;
    const method: PaymentMethod = row.payment_method === 'card' ? 'credit_card' : (row.payment_method as PaymentMethod) || 'cash';
    const status: PaymentStatus = row.status === 'completed' ? 'received' : 'received';

    return {
      id: row.id,
      paymentNumber: row.payment_number,
      invoiceId: row.invoice_id,
      invoiceNumber: invoice?.invoiceNumber || '',
      customerId: row.customer_id,
      customerName: customer?.displayName || customer?.companyName || 'Unknown Customer',
      customerEmail: customer?.email || '',
      date: row.payment_date ? new Date(row.payment_date).toISOString().split('T')[0] : '',
      amount,
      paymentMethod: method,
      referenceNumber: row.reference_number || undefined,
      notes: row.notes || undefined,
      status,
      allocatedAmount: amount,
      unallocatedAmount: 0,
      allocations: [
        {
          id: `alloc_${row.id}`,
          paymentId: row.id,
          invoiceId: row.invoice_id,
          invoiceNumber: invoice?.invoiceNumber || '',
          amount,
          date: row.payment_date ? new Date(row.payment_date).toISOString().split('T')[0] : '',
        },
      ],
      createdAt: row.created_at,
    };
  }

  async listPayments(context: AuthContext, options: Omit<PaymentQueryOptions, 'organizationId'>) {
    const res = await this.repo.list({
      organizationId: context.organization.id,
      ...options,
    });

    return {
      data: res.data.map((r: any) => this.mapRowToPayment(r)),
      total: res.total,
    };
  }

  async getPaymentById(context: AuthContext, id: string): Promise<Payment> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToPayment(row);
  }

  async createPayment(context: AuthContext, input: PaymentCreateInput): Promise<Payment> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload = {
      organization_id: context.organization.id,
      invoice_id: input.invoiceId,
      amount: input.amount,
      payment_date: new Date(input.date).toISOString(),
      payment_method: input.paymentMethod === 'credit_card' ? 'card' : input.paymentMethod,
      reference_number: input.referenceNumber || null,
      notes: input.notes || null,
      status: 'completed',
      created_by: context.user.id,
    };

    const row = await this.repo.create(payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Payment', row.id, {
      action: 'payment.created',
      amount: input.amount,
      invoiceId: input.invoiceId,
    });

    return this.mapRowToPayment(row);
  }

  async deletePayment(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin'], context.membership.role);
    await this.repo.delete(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Payment', id, {
      action: 'payment.deleted',
    });

    return true;
  }
}
