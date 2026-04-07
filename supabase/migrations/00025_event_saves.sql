-- Event saves: one row per (profile_id, event_id); denormalized saves_count on events.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS saves_count integer NOT NULL DEFAULT 0;

CREATE TABLE event_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, event_id)
);

CREATE INDEX idx_event_saves_event_id ON event_saves(event_id);
CREATE INDEX idx_event_saves_profile_id ON event_saves(profile_id);

ALTER TABLE event_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event saves"
  ON event_saves FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can save active events"
  ON event_saves FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can remove own event saves"
  ON event_saves FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION events_preserve_saves_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(current_setting('app.maintaining_event_saves', true), '') = '1' THEN
    RETURN NEW;
  END IF;
  IF NEW.saves_count IS DISTINCT FROM OLD.saves_count THEN
    NEW.saves_count := OLD.saves_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_preserve_saves_count_trigger ON events;
CREATE TRIGGER events_preserve_saves_count_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION events_preserve_saves_count();

CREATE OR REPLACE FUNCTION event_saves_apply_count_delta(p_event_id uuid, p_delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.maintaining_event_saves', '1', true);
  UPDATE events
  SET saves_count = GREATEST(0, saves_count + p_delta)
  WHERE id = p_event_id;
  PERFORM set_config('app.maintaining_event_saves', '', true);
END;
$$;

CREATE OR REPLACE FUNCTION event_saves_after_insert_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM event_saves_apply_count_delta(NEW.event_id, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION event_saves_after_delete_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM event_saves_apply_count_delta(OLD.event_id, -1);
  RETURN OLD;
END;
$$;

CREATE TRIGGER event_saves_after_insert
  AFTER INSERT ON event_saves
  FOR EACH ROW
  EXECUTE FUNCTION event_saves_after_insert_row();

CREATE TRIGGER event_saves_after_delete
  AFTER DELETE ON event_saves
  FOR EACH ROW
  EXECUTE FUNCTION event_saves_after_delete_row();
