-- Expose comments to Supabase Realtime so authenticated clients receive
-- postgres_changes while the comments modal is open.

ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
