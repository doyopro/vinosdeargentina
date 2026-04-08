-- Force PostgREST schema cache invalidation by adding and removing a comment
COMMENT ON TABLE public.orders IS 'De Altura Wines Orders - Schema reloaded';

-- Force a small schema change to trigger cache invalidation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS _force_reload BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS _force_reload;

-- Explicit notification to pgrst
NOTIFY pgrst, 'reload schema';
