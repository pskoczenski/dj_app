-- Fix PATCH/UPDATE returning 403 when PostgREST runs UPDATE ... RETURNING:
-- RLS SELECT only allowed rows with deleted_at IS NULL, so owners could not
-- "see" their own soft-deleted (or updated) row in the return payload and
-- the request failed even when UPDATE USING passed.
--
-- This policy lets each user SELECT all of their own mixes (any deleted_at),
-- while everyone else still only sees active mixes via the existing policy.

CREATE POLICY "Owners can select own mixes"
  ON mixes FOR SELECT TO authenticated
  USING (profile_id = auth.uid());
