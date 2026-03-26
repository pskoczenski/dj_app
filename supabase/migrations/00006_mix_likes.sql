-- Mix likes: one row per (profile_id, mix_id); denormalized likes_count on mixes.

ALTER TABLE mixes
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE TABLE mix_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mix_id uuid NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, mix_id)
);

CREATE INDEX idx_mix_likes_mix_id ON mix_likes(mix_id);
CREATE INDEX idx_mix_likes_profile_id ON mix_likes(profile_id);

ALTER TABLE mix_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mix likes"
  ON mix_likes FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can like active mixes"
  ON mix_likes FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM mixes m
      WHERE m.id = mix_id AND m.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can remove own mix likes"
  ON mix_likes FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- Prevent clients from forging likes_count on ordinary profile updates.
CREATE OR REPLACE FUNCTION mixes_preserve_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(current_setting('app.maintaining_mix_likes', true), '') = '1' THEN
    RETURN NEW;
  END IF;
  IF NEW.likes_count IS DISTINCT FROM OLD.likes_count THEN
    NEW.likes_count := OLD.likes_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mixes_preserve_likes_count_trigger ON mixes;
CREATE TRIGGER mixes_preserve_likes_count_trigger
  BEFORE UPDATE ON mixes
  FOR EACH ROW
  EXECUTE FUNCTION mixes_preserve_likes_count();

CREATE OR REPLACE FUNCTION mix_likes_apply_count_delta(p_mix_id uuid, p_delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.maintaining_mix_likes', '1', true);
  UPDATE mixes
  SET likes_count = GREATEST(0, likes_count + p_delta)
  WHERE id = p_mix_id;
  PERFORM set_config('app.maintaining_mix_likes', '', true);
END;
$$;

CREATE OR REPLACE FUNCTION mix_likes_after_insert_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM mix_likes_apply_count_delta(NEW.mix_id, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION mix_likes_after_delete_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM mix_likes_apply_count_delta(OLD.mix_id, -1);
  RETURN OLD;
END;
$$;

CREATE TRIGGER mix_likes_after_insert
  AFTER INSERT ON mix_likes
  FOR EACH ROW
  EXECUTE FUNCTION mix_likes_after_insert_row();

CREATE TRIGGER mix_likes_after_delete
  AFTER DELETE ON mix_likes
  FOR EACH ROW
  EXECUTE FUNCTION mix_likes_after_delete_row();
