-- ============================================================
-- 00023: Run can_insert_conversation_participant with row_security off
--
-- Problem:
--   can_insert_conversation_participant (00022) reads conversations and
--   events inside a SECURITY DEFINER function. On PostgreSQL 15+, RLS
--   still applies to those reads for the function owner unless the role
--   bypasses RLS. The new event_group row has no participants yet, so
--   "Participants can view conversations" hides the row → NOT FOUND →
--   false → WITH CHECK fails → 42501 on conversation_participants upsert.
--   The event row is already inserted; the client shows a failure toast.
--
-- Fix:
--   Disable row security for the duration of this function only so it can
--   read conversation + event metadata and enforce rules in one place.
-- ============================================================

ALTER FUNCTION public.can_insert_conversation_participant(uuid, uuid)
  SET row_security = off;
