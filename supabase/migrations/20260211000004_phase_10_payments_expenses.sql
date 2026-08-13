-- ====================================================================
-- PHASE 10 MIGRATION: PAYMENTS & EXPENSES ENHANCEMENTS & INDEXES
-- ====================================================================

-- 1. ADD UPDATED_BY TO PAYMENTS IF NOT PRESENT
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 2. CREATE PERFORMANCE INDEXES FOR PAYMENTS AND EXPENSES
CREATE INDEX IF NOT EXISTS idx_payments_org_date ON public.payments(organization_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_org_method ON public.payments(organization_id, payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON public.expenses(organization_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_org_category ON public.expenses(organization_id, category);

-- 3. ENSURE POSITIVE AMOUNT CONSTRAINTS ARE ACTIVE
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS check_payment_amount_positive;
ALTER TABLE public.payments ADD CONSTRAINT check_payment_amount_positive CHECK (amount > 0);

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS check_expense_amount_positive;
ALTER TABLE public.expenses ADD CONSTRAINT check_expense_amount_positive CHECK (amount > 0);
