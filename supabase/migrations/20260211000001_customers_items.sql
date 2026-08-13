-- ====================================================================
-- PHASE 7 MIGRATION: CUSTOMERS AND ITEMS PRODUCTION TABLES & RLS
-- ====================================================================

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_number TEXT NOT NULL,
  customer_type TEXT DEFAULT 'business',
  company_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  tax_type TEXT DEFAULT 'GST',
  gstin TEXT,
  pan TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  billing_address JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  same_as_billing_address BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_invoiced NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  paid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  outstanding NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_org_customer_number UNIQUE (organization_id, customer_number)
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customer Indexes
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_number ON public.customers(organization_id, customer_number);
CREATE INDEX IF NOT EXISTS idx_customers_org_display_name ON public.customers(organization_id, display_name);
CREATE INDEX IF NOT EXISTS idx_customers_org_email ON public.customers(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_org_active ON public.customers(organization_id, is_active);


-- 2. ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  type TEXT DEFAULT 'product',
  description TEXT,
  category TEXT DEFAULT 'General',
  unit TEXT DEFAULT 'pcs',
  selling_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(15,2) DEFAULT 0.00,
  tax_type TEXT DEFAULT 'GST',
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  hsn_sac_code TEXT,
  discount_rate NUMERIC(5,2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_org_item_code UNIQUE (organization_id, item_code)
);

-- Enable RLS on items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Item Indexes
CREATE INDEX IF NOT EXISTS idx_items_org_id ON public.items(organization_id);
CREATE INDEX IF NOT EXISTS idx_items_org_code ON public.items(organization_id, item_code);
CREATE INDEX IF NOT EXISTS idx_items_org_name ON public.items(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_items_org_category ON public.items(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_items_org_active ON public.items(organization_id, is_active);


-- ====================================================================
-- ROW LEVEL SECURITY POLICIES (CUSTOMERS & ITEMS)
-- ====================================================================

-- --- CUSTOMERS POLICIES ---
CREATE POLICY "Members can view organization customers"
  ON public.customers FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can insert organization customers"
  ON public.customers FOR INSERT
  WITH CHECK (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can update organization customers"
  ON public.customers FOR UPDATE
  USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can delete organization customers"
  ON public.customers FOR DELETE
  USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );


-- --- ITEMS POLICIES ---
CREATE POLICY "Members can view organization items"
  ON public.items FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized roles can insert organization items"
  ON public.items FOR INSERT
  WITH CHECK (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can update organization items"
  ON public.items FOR UPDATE
  USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin', 'accountant', 'staff')
  );

CREATE POLICY "Authorized roles can delete organization items"
  ON public.items FOR DELETE
  USING (
    public.is_organization_member(organization_id) AND
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );
