-- PostgREST UPDATE returns the updated row; that row must pass SELECT RLS.
-- The policy "Authenticated users can view published events" requires deleted_at IS NULL,
-- so after soft-delete the post-update row fails SELECT and the whole UPDATE is rejected
-- (42501 / "new row violates row-level security policy").
--
-- Creators may always read their own event rows (including soft-deleted). Public discovery
-- still filters deleted_at IS NULL in application queries.

DROP POLICY IF EXISTS "Creators can view own events" ON public.events;

CREATE POLICY "Creators can view own events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
