-- ====================================================================
-- MIGRATION: ADD EXPENSE_SCOPE, BILLABLE, AND CUSTOMER_ID TO EXPENSES
-- ====================================================================

-- 1. ADD COLUMNS WITH SAFE DEFAULTS TO PRESERVE EXISTING RECORDS
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS expense_scope TEXT NOT NULL DEFAULT 'business' CHECK (expense_scope IN ('business', 'customer')),
  ADD COLUMN IF NOT EXISTS billable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 2. CREATE INDEXES FOR FILTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_expenses_org_scope ON public.expenses(organization_id, expense_scope);
CREATE INDEX IF NOT EXISTS idx_expenses_org_billable ON public.expenses(organization_id, billable);
CREATE INDEX IF NOT EXISTS idx_expenses_customer_id ON public.expenses(customer_id);
