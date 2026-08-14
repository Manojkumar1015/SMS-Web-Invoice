import { TemplateRepository } from '@/repositories/template.repository';
import { AuthContext, requireRole } from '@/lib/api/auth-context';
import { logAuditEvent } from '@/lib/api/audit';
import { InvoiceTemplate, TemplateCreateInput, TemplateConfiguration } from '@/types/template';
import { mockTemplates } from '@/data/mockTemplates';
import { NotFoundError } from '@/lib/api/errors';

export class TemplateService {
  private repo = new TemplateRepository();

  private mapRowToTemplate(row: any): InvoiceTemplate {
    const rawConfig = row.config || {};
    const category = row.category || rawConfig.category || 'gst_standard';

    const config: TemplateConfiguration = {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category,
      isSystem: !!row.is_system,
      isDefault: !!row.is_default,
      updatedAt: row.updated_at,
      branding: rawConfig.branding || { logoVisible: true, logoSize: 'medium', logoAlignment: 'left', showCompanyName: true, showCompanyDetails: true },
      colors: rawConfig.colors || { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa', background: '#ffffff', text: '#0f172a', tableHeaderBg: '#f1f5f9', tableHeaderText: '#0f172a', border: '#e2e8f0' },
      typography: rawConfig.typography || { fontFamily: 'Inter', headingSize: 20, bodySize: 14, tableSize: 13, headingWeight: 'semibold', bodyWeight: 'normal' },
      layout: rawConfig.layout || { pageSize: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 }, sectionSpacing: 16, tableSpacing: 12 },
      header: rawConfig.header || { style: 'classic', logoPosition: 'left', companyPos: 'left', docTitlePos: 'right', showBannerBg: false },
      customer: rawConfig.customer || { showName: true, showCompany: true, showEmail: true, showPhone: true, showBillingAddress: true, showShippingAddress: true, showGstin: true, showPan: true, layout: 'grid' },
      invoiceDetails: rawConfig.invoiceDetails || { showInvoiceNumber: true, showDate: true, showDueDate: true, showPaymentTerms: true, showRefNumber: false },
      itemsTable: rawConfig.itemsTable || { columns: [], showBorders: true, showRowBorders: true, headerBg: true, stripedRows: false, compactRows: false },
      taxes: rawConfig.taxes || { showTaxColumn: true, showTaxSummary: true, breakdownGst: true, showCgstSgstIgst: true },
      totals: rawConfig.totals || { showSubtotal: true, showDiscount: true, showTax: true, showRoundOff: true, showGrandTotal: true, grandTotalEmphasis: true, alignment: 'right' },
      payment: rawConfig.payment || { showBankDetails: true, showUpiQr: false, bankName: '', accountName: '', accountNumber: '', ifscCode: '', branchName: '', upiId: '', instructions: '' },
      notes: rawConfig.notes || { visible: true, heading: 'Notes', text: '' },
      terms: rawConfig.terms || { visible: true, heading: 'Terms & Conditions', text: '' },
      signature: rawConfig.signature || { visible: false, label: 'Authorized Signatory', authorizedPerson: '', designation: '', showDigitalStamp: false },
      footer: rawConfig.footer || { visible: true, text: 'Thank you for your business!', showPageNumbers: true, alignment: 'center' },
      watermark: rawConfig.watermark || { enabled: false, text: 'PAID', opacity: 0.1, rotation: -45, color: '#000000' },
      sections: rawConfig.sections || [],
    };

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category,
      isSystem: !!row.is_system,
      isDefault: !!row.is_default,
      updatedAt: row.updated_at,
      config,
    };
  }

  async listTemplates(
    context: AuthContext,
    options?: { search?: string; status?: string; category?: string }
  ): Promise<InvoiceTemplate[]> {
    const rows = await this.repo.list(context.organization.id);
    const dbTemplates = rows.map((r: any) => this.mapRowToTemplate(r));

    const dbIds = new Set(dbTemplates.map((t: InvoiceTemplate) => t.id));
    const isAnyDefaultInDb = dbTemplates.some((t: InvoiceTemplate) => t.isDefault);

    const systemTemplates = mockTemplates
      .map((sys) => (isAnyDefaultInDb ? { ...sys, isDefault: false } : sys))
      .filter((sys) => !dbIds.has(sys.id));

    let result = [...dbTemplates, ...systemTemplates].slice(0, 4);

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (options?.category && options.category !== 'all') {
      result = result.filter((t) => t.category === options.category);
    }

    if (options?.status && options.status !== 'all') {
      if (options.status === 'custom') {
        result = result.filter((t) => !t.isSystem);
      } else if (options.status === 'system') {
        result = result.filter((t) => t.isSystem);
      } else if (options.status === 'default') {
        result = result.filter((t) => t.isDefault);
      }
    }

    return result;
  }

  async getTemplateById(context: AuthContext, id: string): Promise<InvoiceTemplate> {
    try {
      const row = await this.repo.getById(id, context.organization.id);
      return this.mapRowToTemplate(row);
    } catch {
      const sys = mockTemplates.find((t) => t.id === id);
      if (sys) return sys;
      throw new NotFoundError(`Template with ID ${id} not found.`);
    }
  }

  async getDefaultTemplate(context: AuthContext): Promise<InvoiceTemplate | null> {
    const row = await this.repo.getDefault(context.organization.id);
    if (row) return this.mapRowToTemplate(row);

    const all = await this.listTemplates(context);
    const def = all.find((t) => t.isDefault);
    if (def) return def;

    return all[0] || mockTemplates[0] || null;
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

    let existingRow: any = null;
    try {
      existingRow = await this.repo.getById(id, context.organization.id);
    } catch {
      const sys = mockTemplates.find((t) => t.id === id);
      if (sys) {
        return this.createTemplate(context, {
          name: input.name || sys.name,
          description: input.description || sys.description,
          category: sys.category,
          isSystem: false,
          isDefault: input.isDefault ?? sys.isDefault,
          config: input.config || sys.config,
        });
      }
      throw new NotFoundError(`Template with ID ${id} not found.`);
    }

    const payload: Record<string, any> = {
      config: input.config || existingRow.config,
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
