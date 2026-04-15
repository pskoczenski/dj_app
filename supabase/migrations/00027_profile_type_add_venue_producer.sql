-- Add new profile types for venue accounts and music producers.
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'venue';
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'producer';
