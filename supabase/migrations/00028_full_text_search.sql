-- Add STORED generated tsvector columns for full-text search on profiles, events, and mixes.
-- Postgres maintains these automatically on every INSERT/UPDATE.
-- GIN indexes make tsvector @@ tsquery lookups fast.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(display_name, '') || ' ' ||
        coalesce(bio, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS profiles_search_vector_idx
  ON public.profiles USING GIN (search_vector);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(venue, '') || ' ' ||
        coalesce(street_address, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS events_search_vector_idx
  ON public.events USING GIN (search_vector);

ALTER TABLE public.mixes
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS mixes_search_vector_idx
  ON public.mixes USING GIN (search_vector);
