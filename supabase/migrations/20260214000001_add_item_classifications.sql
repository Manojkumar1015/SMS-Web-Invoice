-- ====================================================================
-- MIGRATION: HSN/SAC CLASSIFICATION SYSTEM
-- ====================================================================

-- 1. ITEM CLASSIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.item_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  classification_type TEXT NOT NULL CHECK (classification_type IN ('HSN', 'SAC')),
  relevance TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.item_classifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated and anon users
CREATE POLICY "Members can view item classifications"
  ON public.item_classifications FOR SELECT
  USING (is_active = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_item_classifications_code ON public.item_classifications(code);
CREATE INDEX IF NOT EXISTS idx_item_classifications_category ON public.item_classifications(category);
CREATE INDEX IF NOT EXISTS idx_item_classifications_type ON public.item_classifications(classification_type);
CREATE INDEX IF NOT EXISTS idx_item_classifications_active ON public.item_classifications(is_active);

-- 2. SEED HSN MASTER DATA
INSERT INTO public.item_classifications (code, description, category, classification_type, relevance) VALUES
('8523.80.20', 'Information Technology Software', 'Digital / Software', 'HSN', 'High'),
('8523.80.60', '2-D/3-D computer graphics', 'Graphic / Design', 'HSN', 'High'),
('8523.80.30', 'Audio-visual news / audio-visual material', 'Video / Media', 'HSN', 'Medium'),
('8523.80.40', 'Children''s video films', 'Video', 'HSN', 'Low / Specific'),
('8523.80.50', 'Video tapes of educational nature', 'Video', 'HSN', 'Low / Specific'),
('8525.80.10', 'Television cameras', 'Video / TV Equipment', 'HSN', 'Equipment'),
('8525.80.20', 'Digital cameras', 'Photography', 'HSN', 'Equipment'),
('8525.80.30', 'Video camera recorders', 'Video / Production', 'HSN', 'Equipment'),
('8521.90.90', 'Other video recording/reproducing apparatus', 'Video / Media Equipment', 'HSN', 'Equipment'),
('4906.00.00', 'Plans/drawings for commercial and similar purposes', 'Design / Artwork', 'HSN', 'Design-related physical material'),
('4902.10.10', 'Newspapers', 'Publishing', 'HSN', 'Printed publishing'),
('4902.10.20', 'Journals and periodicals', 'Publishing', 'HSN', 'Printed publishing'),
('4902.90.10', 'Newspapers', 'Publishing', 'HSN', 'Printed publishing'),
('4902.90.20', 'Journals and periodicals', 'Publishing', 'HSN', 'Printed publishing'),
('8443.19.xx', 'Printing machinery', 'Printing', 'HSN', 'Equipment'),
('8443.32.40', 'Laser jet printer', 'Printing', 'HSN', 'Equipment'),
('8443.32.50', 'Ink jet printer', 'Printing', 'HSN', 'Equipment')
ON CONFLICT DO NOTHING;

-- 3. UPDATE ITEMS TABLE
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'Product';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS classification_id UUID REFERENCES public.item_classifications(id) ON DELETE SET NULL;

-- 4. UPDATE INVOICE ITEMS TABLE
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS classification_id UUID REFERENCES public.item_classifications(id) ON DELETE SET NULL;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS classification_code TEXT NULL;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS classification_type TEXT NULL;

-- 5. UPDATE QUOTE ITEMS TABLE
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS classification_id UUID REFERENCES public.item_classifications(id) ON DELETE SET NULL;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS classification_code TEXT NULL;
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS classification_type TEXT NULL;
