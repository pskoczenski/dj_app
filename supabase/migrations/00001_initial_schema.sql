-- Mirrorball — initial schema
-- Apply via Supabase SQL Editor or `supabase db reset` (local CLI).
-- Postgres does not support IF NOT EXISTS for CREATE TYPE;
-- this migration is designed to run once on a fresh database.

-- ============================================================
-- 1. Enums
-- ============================================================

CREATE TYPE profile_type AS ENUM ('dj', 'promoter', 'fan');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled');
CREATE TYPE mix_platform AS ENUM ('soundcloud', 'mixcloud', 'youtube', 'spotify', 'apple_music', 'other');

-- ============================================================
-- 2. Trigger function: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. profiles
-- ============================================================

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text,
  city text,
  state text,
  country text,
  genres text[] DEFAULT '{}',
  profile_image_url text,
  social_links jsonb DEFAULT '{}',
  profile_type profile_type NOT NULL DEFAULT 'dj',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_profiles_active ON profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_location ON profiles(city, state);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active profiles"
  ON profiles FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- 4. events
-- ============================================================

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  venue text,
  city text,
  state text,
  country text,
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  google_place_id text,
  start_date date NOT NULL,
  end_date date,
  start_time time,
  end_time time,
  flyer_image_url text,
  ticket_url text,
  genres text[] DEFAULT '{}',
  status event_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_location ON events(city, state);
CREATE INDEX idx_events_coordinates ON events(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_genres ON events USING GIN(genres);

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published events"
  ON events FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (status = 'published' OR created_by = auth.uid()));

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update own events"
  ON events FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ============================================================
-- 5. event_lineup
-- ============================================================

CREATE TABLE event_lineup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  set_time time,
  sort_order integer DEFAULT 0,
  is_headliner boolean DEFAULT false,
  added_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

CREATE INDEX idx_event_lineup_event_id ON event_lineup(event_id);
CREATE INDEX idx_event_lineup_profile_id ON event_lineup(profile_id);

ALTER TABLE event_lineup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lineup for visible events"
  ON event_lineup FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_lineup.event_id
    AND events.deleted_at IS NULL
    AND (events.status = 'published' OR events.created_by = auth.uid())
  ));

CREATE POLICY "Event creator can add to lineup"
  ON event_lineup FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.created_by = auth.uid())
    AND added_by = auth.uid()
  );

CREATE POLICY "Event creator can update lineup"
  ON event_lineup FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_lineup.event_id AND events.created_by = auth.uid()
  ));

CREATE POLICY "Creator or tagged DJ can remove from lineup"
  ON event_lineup FOR DELETE TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE events.id = event_lineup.event_id AND events.created_by = auth.uid()
    )
  );

-- ============================================================
-- 6. mixes
-- ============================================================

CREATE TABLE mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  embed_url text NOT NULL,
  platform mix_platform NOT NULL,
  duration interval,
  cover_image_url text,
  genres text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_mixes_profile_id ON mixes(profile_id);
CREATE INDEX idx_mixes_active ON mixes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_mixes_genres ON mixes USING GIN(genres);

CREATE TRIGGER mixes_updated_at BEFORE UPDATE ON mixes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active mixes"
  ON mixes FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can create own mixes"
  ON mixes FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own mixes"
  ON mixes FOR UPDATE TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- 7. follows
-- ============================================================

CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view follows"
  ON follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own follows"
  ON follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- ============================================================
-- 8. genre_tags
-- ============================================================

CREATE TABLE genre_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  usage_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_genre_tags_name ON genre_tags(name text_pattern_ops);
CREATE INDEX idx_genre_tags_usage ON genre_tags(usage_count DESC);

ALTER TABLE genre_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view genre tags"
  ON genre_tags FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 9. upsert_genre_tags function (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_genre_tags(input_genres text[])
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_genres text[];
  genre text;
BEGIN
  SELECT array_agg(DISTINCT lower(trim(g)))
  INTO normalized_genres
  FROM unnest(input_genres) AS g
  WHERE trim(g) != '';

  IF normalized_genres IS NULL THEN
    RETURN '{}';
  END IF;

  FOREACH genre IN ARRAY normalized_genres
  LOOP
    INSERT INTO genre_tags (name, usage_count)
    VALUES (genre, 1)
    ON CONFLICT (name)
    DO UPDATE SET usage_count = genre_tags.usage_count + 1;
  END LOOP;

  RETURN normalized_genres;
END;
$$;

-- ============================================================
-- 10. profile_follow_counts view
-- ============================================================

CREATE VIEW profile_follow_counts WITH (security_invoker = on) AS
SELECT
  p.id AS profile_id,
  COUNT(DISTINCT f1.follower_id) AS followers_count,
  COUNT(DISTINCT f2.following_id) AS following_count
FROM profiles p
LEFT JOIN follows f1 ON f1.following_id = p.id
LEFT JOIN follows f2 ON f2.follower_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;
