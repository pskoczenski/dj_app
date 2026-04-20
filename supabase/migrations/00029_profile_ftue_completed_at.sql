-- First-time user experience: persist tour completion on the profile (nullable = not completed/skipped yet).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ftue_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.ftue_completed_at IS
  'When the first-time app tour was completed or dismissed; NULL means eligible.';
