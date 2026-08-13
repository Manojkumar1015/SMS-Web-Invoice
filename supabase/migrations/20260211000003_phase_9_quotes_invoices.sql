-- ====================================================================
-- PHASE 9 MIGRATION: QUOTES & INVOICES BACKEND ENHANCEMENTS
-- ====================================================================

-- 1. ADD CONVERTED_TO_INVOICE_ID REFERENCE TO QUOTES
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_converted_invoice_id ON public.quotes(converted_to_invoice_id);

-- 2. ADD CREATED_AT & UPDATED_AT TO QUOTE_ITEMS & INVOICE_ITEMS
ALTER TABLE public.quote_items 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.invoice_items 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. ENSURE INDEXES ON QUOTES AND INVOICES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_quotes_org_customer ON public.quotes(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org_date ON public.quotes(organization_id, quote_date);
CREATE INDEX IF NOT EXISTS idx_invoices_org_customer ON public.invoices(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON public.invoices(organization_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_org_due_date ON public.invoices(organization_id, due_date);
