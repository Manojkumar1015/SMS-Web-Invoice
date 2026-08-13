import { ITemplateService } from '../interfaces/TemplateService';
import { InvoiceTemplate, TemplateCreateInput, TemplateConfiguration } from '@/types/template';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabaseTemplateService implements ITemplateService {
  async getTemplates(params?: FilterParams): Promise<PaginatedResult<InvoiceTemplate>> {
    const res = await fetch('/api/v1/invoice-templates', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch templates: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch templates');
    }

    const data = json.data || [];
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length || 25,
      totalPages: 1,
    };
  }

  async getTemplateById(id: string): Promise<InvoiceTemplate | null> {
    const res = await fetch(`/api/v1/invoice-templates/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch template: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async getDefaultTemplate(): Promise<InvoiceTemplate> {
    const res = await this.getTemplates();
    const defaultTpl = res.data.find((t) => t.isDefault);
    if (defaultTpl) return defaultTpl;
    if (res.data.length > 0) return res.data[0];

    const defaultConfig: TemplateConfiguration = {
      id: 'default',
      name: 'Standard Minimal',
      description: 'Default invoice template',
      category: 'gst_standard',
      isSystem: true,
      isDefault: true,
      updatedAt: new Date().toISOString(),
      branding: { logoVisible: true, logoSize: 'medium', logoAlignment: 'left', showCompanyName: true, showCompanyDetails: true },
      colors: { primary: '#0f172a', secondary: '#475569', accent: '#3b82f6', background: '#ffffff', text: '#0f172a', tableHeaderBg: '#f1f5f9', tableHeaderText: '#0f172a', border: '#e2e8f0' },
      typography: { fontFamily: 'Inter', headingSize: 20, bodySize: 14, tableSize: 13, headingWeight: 'semibold', bodyWeight: 'normal' },
      layout: { pageSize: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 }, sectionSpacing: 16, tableSpacing: 12 },
      header: { style: 'classic', logoPosition: 'left', companyPos: 'left', docTitlePos: 'right', showBannerBg: false },
      customer: { showName: true, showCompany: true, showEmail: true, showPhone: true, showBillingAddress: true, showShippingAddress: true, showGstin: true, showPan: true, layout: 'grid' },
      invoiceDetails: { showInvoiceNumber: true, showDate: true, showDueDate: true, showPaymentTerms: true, showRefNumber: false },
      itemsTable: { columns: [], showBorders: true, showRowBorders: true, headerBg: true, stripedRows: false, compactRows: false },
      taxes: { showTaxColumn: true, showTaxSummary: true, breakdownGst: true, showCgstSgstIgst: true },
      totals: { showSubtotal: true, showDiscount: true, showTax: true, showRoundOff: true, showGrandTotal: true, grandTotalEmphasis: true, alignment: 'right' },
      payment: { showBankDetails: true, showUpiQr: false, bankName: '', accountName: '', accountNumber: '', ifscCode: '', branchName: '', upiId: '', instructions: '' },
      notes: { visible: true, heading: 'Notes', text: '' },
      terms: { visible: true, heading: 'Terms & Conditions', text: '' },
      signature: { visible: false, label: 'Authorized Signatory', authorizedPerson: '', designation: '', showDigitalStamp: false },
      footer: { visible: true, text: 'Thank you for your business!', showPageNumbers: true, alignment: 'center' },
      watermark: { enabled: false, text: 'PAID', opacity: 0.1, rotation: -45, color: '#000000' },
      sections: [],
    };

    return {
      id: 'default',
      name: 'Standard Minimal',
      description: 'Default invoice template',
      category: 'gst_standard',
      isSystem: true,
      isDefault: true,
      updatedAt: new Date().toISOString(),
      config: defaultConfig,
    };
  }

  async createTemplate(data: TemplateCreateInput): Promise<InvoiceTemplate> {
    const res = await fetch('/api/v1/invoice-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create template');
    }
    const json = await res.json();
    return json.data;
  }

  async updateTemplate(id: string, data: Partial<TemplateCreateInput>): Promise<InvoiceTemplate> {
    const res = await fetch(`/api/v1/invoice-templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to update template');
    }
    const json = await res.json();
    return json.data;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/invoice-templates/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete template');
    }
    const json = await res.json();
    return !!json.success;
  }

  async duplicateTemplate(id: string): Promise<InvoiceTemplate> {
    const original = await this.getTemplateById(id);
    if (!original) throw new Error('Original template not found');

    const duplicateInput: TemplateCreateInput = {
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      isSystem: false,
      isDefault: false,
      config: original.config,
    };

    return this.createTemplate(duplicateInput);
  }

  async setDefaultTemplate(id: string): Promise<InvoiceTemplate> {
    return this.updateTemplate(id, { isDefault: true });
  }
}
