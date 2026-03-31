-- Step 35: genres master table, genre_ids on profiles/events/mixes, drop genre_tags + upsert_genre_tags

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. genres master
-- ============================================================

CREATE TABLE genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_genres_name ON genres (name);
CREATE UNIQUE INDEX idx_genres_slug ON genres (slug);
CREATE INDEX idx_genres_name_search ON genres USING gin (name gin_trgm_ops);

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Genres are readable by authenticated users"
  ON genres FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO genres (name, slug) VALUES
  ('House', 'house'),
  ('Deep House', 'deep-house'),
  ('Tech House', 'tech-house'),
  ('Progressive House', 'progressive-house'),
  ('Afro House', 'afro-house'),
  ('Acid House', 'acid-house'),
  ('Minimal House', 'minimal-house'),
  ('Funky House', 'funky-house'),
  ('Soulful House', 'soulful-house'),
  ('Jackin House', 'jackin-house'),
  ('Electro House', 'electro-house'),
  ('Bass House', 'bass-house'),
  ('Techno', 'techno'),
  ('Minimal Techno', 'minimal-techno'),
  ('Hard Techno', 'hard-techno'),
  ('Melodic Techno', 'melodic-techno'),
  ('Acid Techno', 'acid-techno'),
  ('Industrial Techno', 'industrial-techno'),
  ('Detroit Techno', 'detroit-techno'),
  ('Dub Techno', 'dub-techno'),
  ('Trance', 'trance'),
  ('Progressive Trance', 'progressive-trance'),
  ('Psytrance', 'psytrance'),
  ('Uplifting Trance', 'uplifting-trance'),
  ('Goa Trance', 'goa-trance'),
  ('Drum & Bass', 'drum-and-bass'),
  ('Liquid Drum & Bass', 'liquid-drum-and-bass'),
  ('Neurofunk', 'neurofunk'),
  ('Jump Up', 'jump-up'),
  ('Jungle', 'jungle'),
  ('Dubstep', 'dubstep'),
  ('Riddim', 'riddim'),
  ('Melodic Dubstep', 'melodic-dubstep'),
  ('Brostep', 'brostep'),
  ('Breakbeat', 'breakbeat'),
  ('Breaks', 'breaks'),
  ('UK Garage', 'uk-garage'),
  ('2-Step', '2-step'),
  ('Speed Garage', 'speed-garage'),
  ('Bassline', 'bassline'),
  ('Disco', 'disco'),
  ('Nu-Disco', 'nu-disco'),
  ('Italo Disco', 'italo-disco'),
  ('Downtempo', 'downtempo'),
  ('Ambient', 'ambient'),
  ('Chillout', 'chillout'),
  ('Lo-Fi', 'lo-fi'),
  ('Electro', 'electro'),
  ('Synthwave', 'synthwave'),
  ('Retrowave', 'retrowave'),
  ('Garage', 'garage'),
  ('Grime', 'grime'),
  ('UK Funky', 'uk-funky'),
  ('Hardstyle', 'hardstyle'),
  ('Hardcore', 'hardcore'),
  ('Gabber', 'gabber'),
  ('Happy Hardcore', 'happy-hardcore'),
  ('Frenchcore', 'frenchcore'),
  ('Trap', 'trap'),
  ('Future Bass', 'future-bass'),
  ('Wave', 'wave'),
  ('Phonk', 'phonk'),
  ('Reggaeton', 'reggaeton'),
  ('Dembow', 'dembow'),
  ('Dancehall', 'dancehall'),
  ('Afrobeats', 'afrobeats'),
  ('Amapiano', 'amapiano'),
  ('Baile Funk', 'baile-funk'),
  ('Experimental', 'experimental'),
  ('IDM', 'idm'),
  ('Glitch', 'glitch'),
  ('Noise', 'noise'),
  ('Hip Hop', 'hip-hop'),
  ('Jersey Club', 'jersey-club'),
  ('Baltimore Club', 'baltimore-club'),
  ('Footwork', 'footwork'),
  ('Juke', 'juke'),
  ('Open Format', 'open-format'),
  ('Top 40', 'top-40'),
  ('Latin', 'latin'),
  ('R&B', 'r-and-b'),
  ('Funk', 'funk'),
  ('Soul', 'soul');

-- ============================================================
-- 2. Drop legacy genre_tags + RPC
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view genre tags" ON genre_tags;
DROP TABLE IF EXISTS genre_tags;
DROP FUNCTION IF EXISTS upsert_genre_tags(input_genres text[]);

-- ============================================================
-- 3. Replace genres text[] with genre_ids uuid[]
-- ============================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS genres;
ALTER TABLE profiles ADD COLUMN genre_ids uuid[] NOT NULL DEFAULT '{}';
CREATE INDEX idx_profiles_genre_ids ON profiles USING gin (genre_ids);

DROP INDEX IF EXISTS idx_events_genres;
ALTER TABLE events DROP COLUMN IF EXISTS genres;
ALTER TABLE events ADD COLUMN genre_ids uuid[] NOT NULL DEFAULT '{}';
CREATE INDEX idx_events_genre_ids ON events USING gin (genre_ids);

DROP INDEX IF EXISTS idx_mixes_genres;
ALTER TABLE mixes DROP COLUMN IF EXISTS genres;
ALTER TABLE mixes ADD COLUMN genre_ids uuid[] NOT NULL DEFAULT '{}';
CREATE INDEX idx_mixes_genre_ids ON mixes USING gin (genre_ids);
