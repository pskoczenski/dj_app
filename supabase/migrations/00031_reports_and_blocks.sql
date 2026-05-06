-- Step 46: Report flow and user blocking

CREATE TYPE report_subject_type AS ENUM ('profile', 'event', 'mix', 'comment', 'message');

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_type report_subject_type NOT NULL,
  subject_id uuid NOT NULL,
  reason text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_subject ON reports(subject_type, subject_id);

CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked_id ON blocks(blocked_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Reports: users can file reports as themselves; no SELECT exposure.
CREATE POLICY "Users can create reports as themselves"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Blocks: blocker can manage their own block list.
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can block as themselves"
  ON blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid() AND blocker_id <> blocked_id);

CREATE POLICY "Users can unblock as themselves"
  ON blocks FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

