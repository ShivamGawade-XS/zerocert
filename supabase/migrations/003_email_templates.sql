-- supabase/migrations/003_email_templates.sql
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS email_subject text,
  ADD COLUMN IF NOT EXISTS email_body text;
