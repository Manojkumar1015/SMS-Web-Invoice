-- ====================================================================
-- PHASE 6A INITIAL MIGRATION: PROFILES, ORGANIZATIONS, MEMBERSHIPS & RLS
-- ====================================================================

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. ORGANIZATIONS TABLE (Multi-Tenant Commercial Entities)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  gstin TEXT,
  pan TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. ORGANIZATION MEMBERS TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')),
  status TEXT NOT NULL CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create Indexes for Fast Tenant Lookup
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);

-- ====================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (Explicit search_path = public)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_organization_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_role(_org_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = _org_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- --- PROFILES POLICIES ---
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- --- ORGANIZATIONS POLICIES ---
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT
  USING (public.is_organization_member(id));

CREATE POLICY "Authenticated users can create organization"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners and Admins can update organization"
  ON public.organizations FOR UPDATE
  USING (
    public.get_user_organization_role(id) IN ('owner', 'admin')
  );

-- --- ORGANIZATION_MEMBERS POLICIES ---
CREATE POLICY "Users can view members of their organization"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_organization_member(organization_id)
  );

CREATE POLICY "Authenticated user can insert initial owner membership or admin can add member"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      (user_id = auth.uid() AND role = 'owner') OR
      public.get_user_organization_role(organization_id) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and Admins can update organization members"
  ON public.organization_members FOR UPDATE
  USING (
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );

CREATE POLICY "Owners and Admins can delete organization members"
  ON public.organization_members FOR DELETE
  USING (
    public.get_user_organization_role(organization_id) IN ('owner', 'admin')
  );

-- ====================================================================
-- STORAGE BUCKETS FOUNDATION (Private document storage)
-- ====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('company-logos', 'company-logos', false),
  ('invoice-attachments', 'invoice-attachments', false),
  ('expense-receipts', 'expense-receipts', false),
  ('payment-attachments', 'payment-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Authenticated users can upload company logo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read company logo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
