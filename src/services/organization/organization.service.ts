import { OrganizationRepository } from '@/repositories/organization.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { BusinessSettings } from '@/types/settings';

export class OrganizationService {
  private repo = new OrganizationRepository();

  async getOrganization(context: AuthContext): Promise<BusinessSettings> {
    const org = await this.repo.getById(context.organization.id);

    return {
      companyName: org?.name || context.organization.name || 'My Organization',
      legalName: org?.legal_name || org?.name || context.organization.name || 'My Organization',
      email: org?.email || context.organization.email || '',
      phone: org?.phone || '',
      website: org?.website || '',
      address: org?.address || '',
      city: org?.city || '',
      state: org?.state || '',
      postalCode: org?.postal_code || '',
      country: org?.country || 'India',
      gstin: org?.gstin || context.organization.gstin || '',
      pan: org?.pan || context.organization.pan || '',
      currency: (org?.currency as any) || context.organization.currency || 'INR',
      timezone: org?.timezone || 'Asia/Kolkata',
      dateFormat: org?.date_format || 'DD/MM/YYYY',
      timeFormat: '12-hour (hh:mm A)',
      logoUrl: org?.logo_url || undefined,
      bankName: org?.bank_name || '',
      accountName: org?.account_name || '',
      accountNumber: org?.account_number || '',
      ifscCode: org?.ifsc_code || '',
      branch: org?.branch || '',
    };
  }

  async updateOrganization(
    context: AuthContext,
    updates: Partial<BusinessSettings>
  ): Promise<BusinessSettings> {
    // 1. Role Authorization Check: Only Owner or Admin can update Organization Profile
    requireRole(['Owner', 'Admin'], context.membership.role);

    // 2. Map domain model updates to database payload
    const payload: Record<string, any> = {};
    if (updates.companyName !== undefined) payload.name = updates.companyName;
    if (updates.legalName !== undefined) payload.legal_name = updates.legalName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.website !== undefined) payload.website = updates.website;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.postalCode !== undefined) payload.postal_code = updates.postalCode;
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.gstin !== undefined) payload.gstin = updates.gstin;
    if (updates.pan !== undefined) payload.pan = updates.pan;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.timezone !== undefined) payload.timezone = updates.timezone;
    if (updates.dateFormat !== undefined) payload.date_format = updates.dateFormat;
    if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
    if (updates.bankName !== undefined) payload.bank_name = updates.bankName;
    if (updates.accountName !== undefined) payload.account_name = updates.accountName;
    if (updates.accountNumber !== undefined) payload.account_number = updates.accountNumber;
    if (updates.ifscCode !== undefined) payload.ifsc_code = updates.ifscCode;
    if (updates.branch !== undefined) payload.branch = updates.branch;

    const updatedOrg = await this.repo.update(context.organization.id, payload);

    // 3. Log Audit Event
    logAuditEvent(
      context.organization.id,
      context.user.id,
      'ORGANIZATION_UPDATED',
      'Organization',
      context.organization.id,
      { updatedFields: Object.keys(payload) }
    );

    return {
      companyName: updatedOrg.name,
      legalName: updatedOrg.legal_name || updatedOrg.name,
      email: updatedOrg.email || '',
      phone: updatedOrg.phone || '',
      website: updatedOrg.website || '',
      address: updatedOrg.address || '',
      city: updatedOrg.city || '',
      state: updatedOrg.state || '',
      postalCode: updatedOrg.postal_code || '',
      country: updatedOrg.country || 'India',
      gstin: updatedOrg.gstin || '',
      pan: updatedOrg.pan || '',
      currency: (updatedOrg.currency as any) || 'INR',
      timezone: updatedOrg.timezone || 'Asia/Kolkata',
      dateFormat: updatedOrg.date_format || 'DD/MM/YYYY',
      timeFormat: '12-hour (hh:mm A)',
      logoUrl: updatedOrg.logo_url || undefined,
      bankName: updatedOrg.bank_name || '',
      accountName: updatedOrg.account_name || '',
      accountNumber: updatedOrg.account_number || '',
      ifscCode: updatedOrg.ifsc_code || '',
      branch: updatedOrg.branch || '',
    };
  }
}
