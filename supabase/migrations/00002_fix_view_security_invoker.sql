-- Fix: enable security_invoker on profile_follow_counts view
-- so RLS policies on profiles/follows are respected at query time.

DROP VIEW IF EXISTS profile_follow_counts;

CREATE VIEW profile_follow_counts WITH (security_invoker = on) AS
SELECT
  p.id AS profile_id,
  COUNT(DISTINCT f1.follower_id) AS followers_count,
  COUNT(DISTINCT f2.following_id) AS following_count
FROM profiles p
LEFT JOIN follows f1 ON f1.following_id = p.id
LEFT JOIN follows f2 ON f2.follower_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;
