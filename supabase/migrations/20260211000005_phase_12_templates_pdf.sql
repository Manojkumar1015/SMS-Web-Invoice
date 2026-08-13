-- Phase 12: Invoice Templates + PDF Generation Migration
-- Indexes for optimized template querying and default template resolution

CREATE INDEX IF NOT EXISTS idx_templates_org_default 
  ON public.invoice_templates(organization_id, is_default) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_invoices_org_template 
  ON public.invoices(organization_id, template_id);
