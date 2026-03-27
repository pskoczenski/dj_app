-- Step 25: Comments schema, likes, and RLS

CREATE TYPE commentable_type AS ENUM ('event', 'mix');

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commentable_type commentable_type NOT NULL,
  commentable_id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_comments_commentable
  ON comments(commentable_type, commentable_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_comments_profile_id
  ON comments(profile_id);

CREATE TABLE comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, profile_id)
);

CREATE INDEX idx_comment_likes_comment_id
  ON comment_likes(comment_id);

CREATE INDEX idx_comment_likes_profile_id
  ON comment_likes(profile_id);

CREATE VIEW comment_counts AS
SELECT
  commentable_type,
  commentable_id,
  COUNT(*)::bigint AS count
FROM comments
WHERE deleted_at IS NULL
GROUP BY commentable_type, commentable_id;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active comments"
  ON comments FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (
        commentable_type = 'event'
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = comments.commentable_id
            AND events.deleted_at IS NULL
            AND (events.status = 'published' OR events.created_by = auth.uid())
        )
      )
      OR
      (
        commentable_type = 'mix'
        AND EXISTS (
          SELECT 1 FROM mixes
          WHERE mixes.id = comments.commentable_id
            AND mixes.deleted_at IS NULL
        )
      )
    )
  );

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND (
      (
        commentable_type = 'event'
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = comments.commentable_id
            AND events.deleted_at IS NULL
            AND (events.status = 'published' OR events.created_by = auth.uid())
        )
      )
      OR
      (
        commentable_type = 'mix'
        AND EXISTS (
          SELECT 1 FROM mixes
          WHERE mixes.id = comments.commentable_id
            AND mixes.deleted_at IS NULL
        )
      )
    )
  );

CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Authenticated users can view comment likes"
  ON comment_likes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can like comments as themselves"
  ON comment_likes FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can remove own comment likes"
  ON comment_likes FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

