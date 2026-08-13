import { CustomerRepository, CustomerQueryOptions } from '@/repositories/customer.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { Customer, CustomerCreateInput } from '@/types/customer';

export class CustomerService {
  private repo = new CustomerRepository();

  private mapRowToCustomer(row: any): Customer {
    return {
      id: row.id,
      customerType: row.customer_type || 'business',
      companyName: row.company_name,
      displayName: row.display_name,
      contactPerson: row.contact_person || '',
      email: row.email || '',
      phone: row.phone || '',
      gstin: row.gstin || undefined,
      pan: row.pan || undefined,
      paymentTerms: row.payment_terms || 'Net 30',
      notes: row.notes || undefined,
      billingAddress: row.billing_address || { street: '', city: '', state: '', postalCode: '', country: 'India' },
      shippingAddress: row.shipping_address || { street: '', city: '', state: '', postalCode: '', country: 'India' },
      sameAsBillingAddress: row.same_as_billing_address ?? true,
      status: row.is_active ? 'active' : 'inactive',
      totalInvoiced: Number(row.total_invoiced) || 0,
      paid: Number(row.paid) || 0,
      outstanding: Number(row.outstanding) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listCustomers(context: AuthContext, options: Omit<CustomerQueryOptions, 'organizationId'>) {
    const res = await this.repo.list({
      organizationId: context.organization.id,
      ...options,
    });

    return {
      data: res.data.map(this.mapRowToCustomer),
      total: res.total,
    };
  }

  async getCustomerById(context: AuthContext, id: string): Promise<Customer> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToCustomer(row);
  }

  async createCustomer(context: AuthContext, input: CustomerCreateInput): Promise<Customer> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const customerNumber = await this.repo.getNextCustomerNumber(context.organization.id);

    const payload = {
      organization_id: context.organization.id,
      customer_number: customerNumber,
      customer_type: input.customerType || 'business',
      company_name: input.companyName,
      display_name: input.displayName,
      contact_person: input.contactPerson || null,
      email: input.email || null,
      phone: input.phone || null,
      gstin: input.gstin || null,
      pan: input.pan || null,
      payment_terms: input.paymentTerms || 'Net 30',
      billing_address: input.billingAddress || {},
      shipping_address: input.shippingAddress || {},
      same_as_billing_address: input.sameAsBillingAddress ?? true,
      notes: input.notes || null,
      is_active: input.status !== 'inactive',
      created_by: context.user.id,
      updated_by: context.user.id,
    };

    const row = await this.repo.create(payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Customer', row.id, {
      action: 'customer.created',
      customerNumber,
    });

    return this.mapRowToCustomer(row);
  }

  async updateCustomer(context: AuthContext, id: string, input: Partial<CustomerCreateInput>): Promise<Customer> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload: Record<string, any> = {
      updated_by: context.user.id,
    };

    if (input.customerType !== undefined) payload.customer_type = input.customerType;
    if (input.companyName !== undefined) payload.company_name = input.companyName;
    if (input.displayName !== undefined) payload.display_name = input.displayName;
    if (input.contactPerson !== undefined) payload.contact_person = input.contactPerson;
    if (input.email !== undefined) payload.email = input.email;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.gstin !== undefined) payload.gstin = input.gstin;
    if (input.pan !== undefined) payload.pan = input.pan;
    if (input.paymentTerms !== undefined) payload.payment_terms = input.paymentTerms;
    if (input.billingAddress !== undefined) payload.billing_address = input.billingAddress;
    if (input.shippingAddress !== undefined) payload.shipping_address = input.shippingAddress;
    if (input.sameAsBillingAddress !== undefined) payload.same_as_billing_address = input.sameAsBillingAddress;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.status !== undefined) payload.is_active = input.status === 'active';

    const row = await this.repo.update(id, context.organization.id, payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Customer', id, {
      action: 'customer.updated',
    });

    return this.mapRowToCustomer(row);
  }

  async archiveCustomer(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    await this.repo.archive(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'Customer', id, {
      action: 'customer.archived',
    });

    return true;
  }
}
