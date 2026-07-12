-- supabase/migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.orgs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  slug          text UNIQUE NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  logo_url      text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  date          date NOT NULL,
  description   text CHECK (char_length(description) <= 2000),
  template      text NOT NULL DEFAULT 'classic',
  serial_prefix text CHECK (serial_prefix ~ '^[A-Za-z0-9/_-]*$'),
  expiry_date   date,
  form_fields   jsonb NOT NULL DEFAULT '["Name","Email"]'::jsonb,
  co_logos      text[] DEFAULT '{}',
  signatories   jsonb DEFAULT '[]'::jsonb,
  cert_count    bigint NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id     text UNIQUE NOT NULL,
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  fields      jsonb NOT NULL,
  sha256_hash text NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  btc_proof   text,
  issued_at   timestamptz DEFAULT now(),
  revoked_at  timestamptz,
  CONSTRAINT unique_claim UNIQUE (event_id, (fields->>'Email'))
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id     uuid NOT NULL REFERENCES public.certs(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  to_email    text NOT NULL,
  subject     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','bounced','failed')),
  resend_id   text,
  opened_at   timestamptz,
  clicked_at  timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_certs_event ON public.certs(event_id);
CREATE INDEX IF NOT EXISTS idx_certs_org ON public.certs(org_id);
CREATE INDEX IF NOT EXISTS idx_certs_cert_id ON public.certs(cert_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_org ON public.email_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(org_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Orgs RLS Policies
CREATE POLICY "Orgs are viewable by owner" ON public.orgs
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Orgs can be updated by owner" ON public.orgs
  FOR UPDATE USING (auth.uid() = id);

-- Events RLS Policies
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Events can be managed by their org owner" ON public.events
  ALL USING (org_id IN (SELECT id FROM public.orgs WHERE id = auth.uid()));

-- Certs RLS Policies
CREATE POLICY "Certs are viewable by everyone" ON public.certs
  FOR SELECT USING (true);

CREATE POLICY "Certs can be claimed publicly" ON public.certs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Certs can be managed by event owner" ON public.certs
  ALL USING (org_id IN (SELECT id FROM public.orgs WHERE id = auth.uid()));

-- Email Logs RLS Policies
CREATE POLICY "Email logs can be managed by org owner" ON public.email_logs
  ALL USING (org_id IN (SELECT id FROM public.orgs WHERE id = auth.uid()));

-- RPC function to atomically increment cert count and return the updated count
CREATE OR REPLACE FUNCTION public.increment_event_cert_count(event_id uuid)
RETURNS bigint AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.events
  SET cert_count = cert_count + 1
  WHERE id = event_id
  RETURNING cert_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

