-- ====================================================================
-- PHASE 8 MIGRATION: QUOTES, INVOICES, PAYMENTS, EXPENSES, TEMPLATES & RLS
-- ====================================================================

-- 1. ORGANIZATION COUNTERS TABLE (For Concurrency-Safe Sequence Generation)
CREATE TABLE IF NOT EXISTS public.organization_counters (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  current_value INT NOT NULL DEFAULT 0,
  prefix TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, entity_type)
);

ALTER TABLE public.organization_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view organization counters"
  ON public.organization_counters FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can update organization counters"
  ON public.organization_counters FOR ALL
  USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

-- Function: Atomic safe number generation
CREATE OR REPLACE FUNCTION public.generate_next_number(_org_id UUID, _entity_type TEXT, _default_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_val INT;
  _prefix TEXT;
BEGIN
  INSERT INTO public.organization_counters (organization_id, entity_type, current_value, prefix)
  VALUES (_org_id, _entity_type, 1, _default_prefix)
  ON CONFLICT (organization_id, entity_type)
  DO UPDATE SET
    current_value = public.organization_counters.current_value + 1,
    updated_at = NOW()
  RETURNING current_value, prefix INTO _next_val, _prefix;

  IF _prefix IS NULL OR _prefix = '' THEN
    _prefix := _default_prefix;
  END IF;

  RETURN _prefix || LPAD(_next_val::TEXT, 5, '0');
END;
$$;


-- 2. QUOTES & QUOTE_ITEMS TABLES
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  quote_number TEXT NOT NULL,
  quote_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_org_quote_number UNIQUE (organization_id, quote_number)
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quotes_org_id ON public.quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(organization_id, status);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 1.000,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) DEFAULT 0.00,
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  tax_amount NUMERIC(15,2) DEFAULT 0.00,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);


-- 3. INVOICES & INVOICE_ITEMS TABLES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  terms TEXT,
  template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_org_invoice_number UNIQUE (organization_id, invoice_number)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(organization_id, status);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 1.000,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) DEFAULT 0.00,
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  tax_amount NUMERIC(15,2) DEFAULT 0.00,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);


-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  payment_number TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other')),
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_org_payment_number UNIQUE (organization_id, payment_number)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_org_id ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);


-- 5. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  expense_number TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  vendor TEXT,
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_org_expense_number UNIQUE (organization_id, expense_number)
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(organization_id, category);


-- 6. INVOICE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_templates_org_id ON public.invoice_templates(organization_id);


-- ====================================================================
-- RLS POLICIES FOR NEW TABLES
-- ====================================================================

-- Quotes Policies
CREATE POLICY "Members can view organization quotes"
  ON public.quotes FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can insert organization quotes"
  ON public.quotes FOR INSERT WITH CHECK (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can update organization quotes"
  ON public.quotes FOR UPDATE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can delete organization quotes"
  ON public.quotes FOR DELETE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );

-- Quote Items Policies
CREATE POLICY "Members can view organization quote items"
  ON public.quote_items FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can manage organization quote items"
  ON public.quote_items FOR ALL USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

-- Invoices Policies
CREATE POLICY "Members can view organization invoices"
  ON public.invoices FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can insert organization invoices"
  ON public.invoices FOR INSERT WITH CHECK (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can update organization invoices"
  ON public.invoices FOR UPDATE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can delete organization invoices"
  ON public.invoices FOR DELETE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );

-- Invoice Items Policies
CREATE POLICY "Members can view organization invoice items"
  ON public.invoice_items FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can manage organization invoice items"
  ON public.invoice_items FOR ALL USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

-- Payments Policies
CREATE POLICY "Members can view organization payments"
  ON public.payments FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can insert organization payments"
  ON public.payments FOR INSERT WITH CHECK (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can update organization payments"
  ON public.payments FOR UPDATE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant')
  );

CREATE POLICY "Authorized roles can delete organization payments"
  ON public.payments FOR DELETE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );

-- Expenses Policies
CREATE POLICY "Members can view organization expenses"
  ON public.expenses FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can insert organization expenses"
  ON public.expenses FOR INSERT WITH CHECK (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can update organization expenses"
  ON public.expenses FOR UPDATE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can delete organization expenses"
  ON public.expenses FOR DELETE USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );

-- Invoice Templates Policies
CREATE POLICY "Members can view organization templates"
  ON public.invoice_templates FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can manage organization templates"
  ON public.invoice_templates FOR ALL USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );
