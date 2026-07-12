-- supabase/migrations/002_custom_theme.sql
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS bg_image text,
  ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#111111',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#B8922A';
