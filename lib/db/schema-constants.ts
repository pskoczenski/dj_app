/**
 * Canonical table and view names used across services.
 * Changing these must also update the SQL migration.
 */
export const TABLES = {
  profiles: "profiles",
  events: "events",
  eventLineup: "event_lineup",
  mixes: "mixes",
  follows: "follows",
  genreTags: "genre_tags",
} as const;

export const VIEWS = {
  profileFollowCounts: "profile_follow_counts",
} as const;

export const ENUMS = {
  profileType: "profile_type",
  eventStatus: "event_status",
  mixPlatform: "mix_platform",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
export type ViewName = (typeof VIEWS)[keyof typeof VIEWS];
