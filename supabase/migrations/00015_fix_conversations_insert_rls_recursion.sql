-- ============================================================
-- 00015: Fix infinite recursion in conversations INSERT RLS
--
-- Root cause:
-- - events SELECT policy (00011) references conversations.
-- - conversations INSERT policy (00014) referenced events.
--   => RLS evaluation loops between events <-> conversations.
--
-- Fix:
-- - Replace conversations INSERT policies with versions that rely on
--   SECURITY DEFINER helpers (no RLS recursion).
-- ============================================================

-- Helpers deliberately bypass RLS by running as table owner.
-- They still use auth.uid() (JWT) for the caller identity.

CREATE OR REPLACE FUNCTION public.event_creator_id(event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.created_by
  FROM events e
  WHERE e.id = event_id
    AND e.deleted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.is_event_lineup_member(event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM event_lineup el
    WHERE el.event_id = event_id
      AND el.profile_id = auth.uid()
  )
$$;

-- Drop INSERT policies from 00014 (if present) and recreate.
DROP POLICY IF EXISTS "Users can create dm conversations" ON conversations;
DROP POLICY IF EXISTS "Eligible users can create event group conversations" ON conversations;

CREATE POLICY "Users can create dm conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    type = 'dm'
    AND event_id IS NULL
    AND created_by = auth.uid()
  );

CREATE POLICY "Eligible users can create event group conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    type = 'event_group'
    AND event_id IS NOT NULL
    AND created_by = public.event_creator_id(event_id)
    AND (
      auth.uid() = public.event_creator_id(event_id)
      OR public.is_event_lineup_member(event_id)
    )
  );

