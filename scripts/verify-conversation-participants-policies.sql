-- Run in Supabase SQL Editor (or psql against the project DB) after migration 00022.
-- Expect: INSERT policy "Eligible event members can add participants";
--         UPDATE policy "Participants can update own last_read_at";
--         TRIGGER conversation_participants_immutable on conversation_participants.

SELECT
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public'
  AND cls.relname = 'conversation_participants'
ORDER BY pol.polcmd, pol.polname;

SELECT tgname AS trigger_name
FROM pg_trigger
WHERE tgrelid = 'public.conversation_participants'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
