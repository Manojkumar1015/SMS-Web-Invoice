import { InvoiceTemplate, TemplateCreateInput } from '@/types/template';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface ITemplateService {
  getTemplates(params?: FilterParams & { category?: string; isSystem?: boolean }): Promise<PaginatedResult<InvoiceTemplate>>;
  getTemplateById(id: string): Promise<InvoiceTemplate | null>;
  getDefaultTemplate(): Promise<InvoiceTemplate>;
  createTemplate(data: TemplateCreateInput): Promise<InvoiceTemplate>;
  updateTemplate(id: string, data: Partial<TemplateCreateInput>): Promise<InvoiceTemplate>;
  deleteTemplate(id: string): Promise<boolean>;
  duplicateTemplate(id: string): Promise<InvoiceTemplate>;
  setDefaultTemplate(id: string): Promise<InvoiceTemplate>;
}
