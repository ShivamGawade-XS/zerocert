-- supabase/migrations/004_db_optimization.sql

-- B-Tree Index on certs JSONB fields to optimize duplicate claim checking
CREATE INDEX IF NOT EXISTS idx_certs_event_email_fields ON public.certs (event_id, (fields->>'Email'));
CREATE INDEX IF NOT EXISTS idx_certs_email_field ON public.certs ((fields->>'Email'));
