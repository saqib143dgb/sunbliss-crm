ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_page_hidden_notes text[] NOT NULL DEFAULT '{}';
COMMENT ON COLUMN public.sales.customer_page_hidden_notes IS 'Note fields hidden from the customer profile; original notes remain available in Notes.';
