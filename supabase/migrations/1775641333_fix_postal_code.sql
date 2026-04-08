-- Ensure postal_code column exists and refresh PostgREST cache
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
