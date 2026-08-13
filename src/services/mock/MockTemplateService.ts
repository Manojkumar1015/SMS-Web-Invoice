import { ITemplateService } from '../interfaces/TemplateService';
import { InvoiceTemplate, TemplateCreateInput, TemplateConfiguration } from '@/types/template';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockTemplates } from '@/data/mockTemplates';

export class MockTemplateService implements ITemplateService {
  private templates: InvoiceTemplate[] = [...mockTemplates];

  async getTemplates(params?: FilterParams & { category?: string; isSystem?: boolean }): Promise<PaginatedResult<InvoiceTemplate>> {
    let result = [...this.templates];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }

    if (params?.category && params.category !== 'all') {
      result = result.filter((t) => t.category === params.category);
    }

    if (params?.status && params.status !== 'all') {
      if (params.status === 'system') {
        result = result.filter((t) => t.isSystem);
      } else if (params.status === 'custom') {
        result = result.filter((t) => !t.isSystem);
      } else if (params.status === 'default') {
        result = result.filter((t) => t.isDefault);
      }
    }

    if (params?.isSystem !== undefined) {
      result = result.filter((t) => t.isSystem === params.isSystem);
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getTemplateById(id: string): Promise<InvoiceTemplate | null> {
    return this.templates.find((t) => t.id === id) || null;
  }

  async getDefaultTemplate(): Promise<InvoiceTemplate> {
    const def = this.templates.find((t) => t.isDefault);
    return def || this.templates[0];
  }

  async createTemplate(data: TemplateCreateInput): Promise<InvoiceTemplate> {
    const newId = `tmpl-custom-${Date.now()}`;
    const defaultTpl = await this.getDefaultTemplate();
    const newTemplate: InvoiceTemplate = {
      id: newId,
      name: data.name,
      description: data.description || '',
      category: data.category || 'gst_standard',
      isSystem: false,
      isDefault: !!data.isDefault,
      updatedAt: new Date().toISOString(),
      config: {
        ...defaultTpl.config,
        ...(data.config || {}),
        id: newId,
        name: data.name,
        isDefault: !!data.isDefault,
        updatedAt: new Date().toISOString(),
      } as TemplateConfiguration,
    };


    if (data.isDefault) {
      this.templates.forEach((t) => {
        t.isDefault = false;
        t.config.isDefault = false;
      });
    }

    this.templates.unshift(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, data: Partial<TemplateCreateInput>): Promise<InvoiceTemplate> {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Template not found');

    const current = this.templates[index];

    if (data.isDefault) {
      this.templates.forEach((t) => {
        t.isDefault = false;
        t.config.isDefault = false;
      });
    }

    const updatedConfig = data.config ? { ...current.config, ...data.config, updatedAt: new Date().toISOString() } : current.config;

    const updated: InvoiceTemplate = {
      ...current,
      ...data,
      config: updatedConfig,
      updatedAt: new Date().toISOString(),
    };

    this.templates[index] = updated;
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const target = this.templates.find((t) => t.id === id);
    if (!target) return false;
    if (target.isSystem) {
      throw new Error('System templates cannot be permanently deleted.');
    }

    const initialLen = this.templates.length;
    this.templates = this.templates.filter((t) => t.id !== id);

    // If deleted template was default, assign default to first system template
    if (target.isDefault && this.templates.length > 0) {
      this.templates[0].isDefault = true;
      this.templates[0].config.isDefault = true;
    }

    return this.templates.length < initialLen;
  }

  async duplicateTemplate(id: string): Promise<InvoiceTemplate> {
    const existing = await this.getTemplateById(id);
    if (!existing) throw new Error('Template not found');

    const newId = `tmpl-custom-${Date.now()}`;
    const duplicatedName = `${existing.name} Copy`;
    const duplicatedConfig = JSON.parse(JSON.stringify(existing.config));
    duplicatedConfig.id = newId;
    duplicatedConfig.name = duplicatedName;
    duplicatedConfig.isSystem = false;
    duplicatedConfig.isDefault = false;
    duplicatedConfig.updatedAt = new Date().toISOString();

    const duplicated: InvoiceTemplate = {
      ...existing,
      id: newId,
      name: duplicatedName,
      isSystem: false,
      isDefault: false,
      updatedAt: new Date().toISOString(),
      config: duplicatedConfig,
    };

    this.templates.unshift(duplicated);
    return duplicated;
  }

  async setDefaultTemplate(id: string): Promise<InvoiceTemplate> {
    const target = await this.getTemplateById(id);
    if (!target) throw new Error('Template not found');

    this.templates.forEach((t) => {
      const isMatch = t.id === id;
      t.isDefault = isMatch;
      t.config.isDefault = isMatch;
    });

    return target;
  }
}
