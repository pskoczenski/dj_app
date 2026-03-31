-- ============================================================
-- 00014: Fix conversations INSERT RLS for event_group threads.
--
-- Problem:
-- - conversations INSERT policy from 00007 requires `created_by = auth.uid()`.
-- - event_group creation uses `created_by = events.created_by` so lineup members
--   (non-creators) cannot create the missing group thread (403 / 42501).
--
-- Fix:
-- - Split INSERT policies:
--   - DM: created_by must be the current user (auth.uid()).
--   - event_group: allow eligible event members (creator or lineup) to create,
--     but enforce that created_by equals the event's creator.
-- ============================================================

-- Drop legacy policy.
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- DM conversations: only allow self-created rows.
CREATE POLICY "Users can create dm conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    type = 'dm'
    AND event_id IS NULL
    AND created_by = auth.uid()
  );

-- Event group conversations: eligible event members can create the thread,
-- but it must be owned by the event creator.
CREATE POLICY "Eligible users can create event group conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    type = 'event_group'
    AND event_id IS NOT NULL
    AND created_by = (
      SELECT e.created_by
      FROM events e
      WHERE e.id = conversations.event_id
        AND e.deleted_at IS NULL
    )
    AND (
      -- event creator
      auth.uid() = (
        SELECT e.created_by
        FROM events e
        WHERE e.id = conversations.event_id
          AND e.deleted_at IS NULL
      )
      -- or lineup member
      OR EXISTS (
        SELECT 1
        FROM event_lineup el
        WHERE el.event_id = conversations.event_id
          AND el.profile_id = auth.uid()
      )
    )
  );

