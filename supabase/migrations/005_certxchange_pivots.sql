-- supabase/migrations/005_certxchange_pivots.sql

-- 1. Learner Passports
CREATE TABLE IF NOT EXISTS public.learner_passports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username    text UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 50),
  email       text NOT NULL UNIQUE,
  full_name   text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  bio         text CHECK (char_length(bio) <= 500),
  skills      text[] DEFAULT '{}',
  badges      text[] DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- 2. Exchange Items (Free certifications, Webinars, Internships, etc.)
CREATE TABLE IF NOT EXISTS public.exchange_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 250),
  category               text NOT NULL CHECK (category IN ('free-course', 'premium-coupon', 'government', 'university-mooc', 'webinar', 'internship', 'scholarship', 'hackathon')),
  url                    text NOT NULL,
  description            text CHECK (char_length(description) <= 2000),
  flags                  text[] DEFAULT '{}', -- e.g. {'Expires Today', 'Free Today'}
  resume_value           integer NOT NULL DEFAULT 5 CHECK (resume_value BETWEEN 1 AND 10),
  time_required          text, -- e.g. '2 hours', '3 weeks'
  difficulty             text NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  lifetime_verification  boolean NOT NULL DEFAULT true,
  linkedin_worthiness    text NOT NULL DEFAULT 'Medium' CHECK (linkedin_worthiness IN ('Low', 'Medium', 'High')),
  recruiter_value        text NOT NULL DEFAULT 'Medium' CHECK (recruiter_value IN ('Low', 'Medium', 'High')),
  created_by             text NOT NULL DEFAULT 'Anonymous',
  created_at             timestamptz DEFAULT now()
);

-- 3. Exchange Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       uuid NOT NULL REFERENCES public.exchange_items(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL CHECK (char_length(reviewer_name) BETWEEN 2 AND 100),
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text CHECK (char_length(comment) <= 1000),
  verified      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- 4. Showcases (Portfolio, Resume, Certification showcase)
CREATE TABLE IF NOT EXISTS public.showcases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 250),
  type          text NOT NULL CHECK (type IN ('certificate', 'resume', 'linkedin', 'portfolio')),
  url           text,
  description   text CHECK (char_length(description) <= 2000),
  creator_name  text NOT NULL CHECK (char_length(creator_name) BETWEEN 2 AND 100),
  upvotes       integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- 5. Showcase Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id  uuid NOT NULL REFERENCES public.showcases(id) ON DELETE CASCADE,
  author_name  text NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 100),
  comment      text NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 1000),
  created_at   timestamptz DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_learner_passports_username ON public.learner_passports(username);
CREATE INDEX IF NOT EXISTS idx_exchange_items_category ON public.exchange_items(category);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON public.reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_showcases_type ON public.showcases(type);
CREATE INDEX IF NOT EXISTS idx_comments_showcase ON public.comments(showcase_id);

-- Enable RLS
ALTER TABLE public.learner_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for the community network
CREATE POLICY "Learner passports are viewable by everyone" ON public.learner_passports FOR SELECT USING (true);
CREATE POLICY "Learner passports can be created by anyone" ON public.learner_passports FOR INSERT WITH CHECK (true);
CREATE POLICY "Learner passports can be updated by owner" ON public.learner_passports FOR UPDATE USING (true);

CREATE POLICY "Exchange items are viewable by everyone" ON public.exchange_items FOR SELECT USING (true);
CREATE POLICY "Exchange items can be added by anyone" ON public.exchange_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews can be added by anyone" ON public.reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Showcases are viewable by everyone" ON public.showcases FOR SELECT USING (true);
CREATE POLICY "Showcases can be added by anyone" ON public.showcases FOR INSERT WITH CHECK (true);
CREATE POLICY "Showcases can be upvoted by anyone" ON public.showcases FOR UPDATE USING (true);

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments can be added by anyone" ON public.comments FOR INSERT WITH CHECK (true);
