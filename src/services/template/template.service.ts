import { TemplateRepository } from '@/repositories/template.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { InvoiceTemplate, TemplateCreateInput, TemplateConfiguration } from '@/types/template';

export class TemplateService {
  private repo = new TemplateRepository();

  private mapRowToTemplate(row: any): InvoiceTemplate {
    const defaultConfig: TemplateConfiguration = {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: 'gst_standard',
      isSystem: false,
      isDefault: !!row.is_default,
      updatedAt: row.updated_at,
      branding: row.config?.branding || { logoVisible: true, logoSize: 'medium', logoAlignment: 'left', showCompanyName: true, showCompanyDetails: true },
      colors: row.config?.colors || { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa', background: '#ffffff', text: '#0f172a', tableHeaderBg: '#f1f5f9', tableHeaderText: '#0f172a', border: '#e2e8f0' },
      typography: row.config?.typography || { fontFamily: 'Inter', headingSize: 20, bodySize: 14, tableSize: 13, headingWeight: 'semibold', bodyWeight: 'normal' },
      layout: row.config?.layout || { pageSize: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 }, sectionSpacing: 16, tableSpacing: 12 },
      header: row.config?.header || { style: 'classic', logoPosition: 'left', companyPos: 'left', docTitlePos: 'right', showBannerBg: false },
      customer: row.config?.customer || { showName: true, showCompany: true, showEmail: true, showPhone: true, showBillingAddress: true, showShippingAddress: true, showGstin: true, showPan: true, layout: 'grid' },
      invoiceDetails: row.config?.invoiceDetails || { showInvoiceNumber: true, showDate: true, showDueDate: true, showPaymentTerms: true, showRefNumber: false },
      itemsTable: row.config?.itemsTable || { columns: [], showBorders: true, showRowBorders: true, headerBg: true, stripedRows: false, compactRows: false },
      taxes: row.config?.taxes || { showTaxColumn: true, showTaxSummary: true, breakdownGst: true, showCgstSgstIgst: true },
      totals: row.config?.totals || { showSubtotal: true, showDiscount: true, showTax: true, showRoundOff: true, showGrandTotal: true, grandTotalEmphasis: true, alignment: 'right' },
      payment: row.config?.payment || { showBankDetails: true, showUpiQr: false, bankName: '', accountName: '', accountNumber: '', ifscCode: '', branchName: '', upiId: '', instructions: '' },
      notes: row.config?.notes || { visible: true, heading: 'Notes', text: '' },
      terms: row.config?.terms || { visible: true, heading: 'Terms & Conditions', text: '' },
      signature: row.config?.signature || { visible: false, label: 'Authorized Signatory', authorizedPerson: '', designation: '', showDigitalStamp: false },
      footer: row.config?.footer || { visible: true, text: 'Thank you for your business!', showPageNumbers: true, alignment: 'center' },
      watermark: row.config?.watermark || { enabled: false, text: 'PAID', opacity: 0.1, rotation: -45, color: '#000000' },
      sections: row.config?.sections || [],
    };

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: 'gst_standard',
      isSystem: false,
      isDefault: !!row.is_default,
      updatedAt: row.updated_at,
      config: defaultConfig,
    };
  }

  async listTemplates(context: AuthContext): Promise<InvoiceTemplate[]> {
    const rows = await this.repo.list(context.organization.id);
    return rows.map((r: any) => this.mapRowToTemplate(r));
  }

  async getTemplateById(context: AuthContext, id: string): Promise<InvoiceTemplate> {
    const row = await this.repo.getById(id, context.organization.id);
    return this.mapRowToTemplate(row);
  }

  async getDefaultTemplate(context: AuthContext): Promise<InvoiceTemplate | null> {
    const row = await this.repo.getDefault(context.organization.id);
    return row ? this.mapRowToTemplate(row) : null;
  }

  async createTemplate(context: AuthContext, input: TemplateCreateInput): Promise<InvoiceTemplate> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const payload = {
      organization_id: context.organization.id,
      name: input.name,
      description: input.description || null,
      is_default: input.isDefault ?? false,
      config: input.config || {},
      is_active: true,
      created_by: context.user.id,
    };

    const row = await this.repo.create(payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'InvoiceTemplate', row.id, {
      action: 'template.created',
      name: input.name,
    });

    return this.mapRowToTemplate(row);
  }

  async updateTemplate(context: AuthContext, id: string, input: Partial<TemplateCreateInput>): Promise<InvoiceTemplate> {
    requireRole(['Owner', 'Admin', 'Accountant', 'Staff'], context.membership.role);

    const existing = await this.repo.getById(id, context.organization.id);

    const payload: Record<string, any> = {
      config: input.config || existing.config,
    };

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.isDefault !== undefined) payload.is_default = input.isDefault;

    const row = await this.repo.update(id, context.organization.id, payload);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'InvoiceTemplate', id, {
      action: 'template.updated',
    });

    return this.mapRowToTemplate(row);
  }

  async deleteTemplate(context: AuthContext, id: string): Promise<boolean> {
    requireRole(['Owner', 'Admin'], context.membership.role);
    await this.repo.delete(id, context.organization.id);

    logAuditEvent(context.organization.id, context.user.id, 'ORGANIZATION_UPDATED' as any, 'InvoiceTemplate', id, {
      action: 'template.archived',
    });

    return true;
  }
}
