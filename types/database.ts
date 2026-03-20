/**
 * Hand-written Database types matching the SQL schema.
 * Replace with `npx supabase gen types typescript` when CLI is available.
 */

export type ProfileType = "dj" | "promoter" | "fan";
export type EventStatus = "draft" | "published" | "cancelled";
export type MixPlatform =
  | "soundcloud"
  | "mixcloud"
  | "youtube"
  | "spotify"
  | "apple_music"
  | "other";

export interface ProfileRow {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  genres: string[];
  profile_image_url: string | null;
  social_links: Record<string, string>;
  profile_type: ProfileType;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfileInsert {
  id: string;
  display_name: string;
  slug: string;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  genres?: string[];
  profile_image_url?: string | null;
  social_links?: Record<string, string>;
  profile_type?: ProfileType;
}

export interface ProfileUpdate {
  display_name?: string;
  slug?: string;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  genres?: string[];
  profile_image_url?: string | null;
  social_links?: Record<string, string>;
  profile_type?: ProfileType;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  flyer_image_url: string | null;
  ticket_url: string | null;
  genres: string[];
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EventInsert {
  title: string;
  start_date: string;
  created_by: string;
  description?: string | null;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  flyer_image_url?: string | null;
  ticket_url?: string | null;
  genres?: string[];
  status?: EventStatus;
}

export interface EventUpdate {
  title?: string;
  description?: string | null;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  start_date?: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  flyer_image_url?: string | null;
  ticket_url?: string | null;
  genres?: string[];
  status?: EventStatus;
}

export interface EventLineupRow {
  id: string;
  event_id: string;
  profile_id: string;
  set_time: string | null;
  sort_order: number;
  is_headliner: boolean;
  added_by: string;
  created_at: string;
}

export interface EventLineupInsert {
  event_id: string;
  profile_id: string;
  added_by: string;
  set_time?: string | null;
  sort_order?: number;
  is_headliner?: boolean;
}

export interface MixRow {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  embed_url: string;
  platform: MixPlatform;
  duration: string | null;
  cover_image_url: string | null;
  genres: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MixInsert {
  profile_id: string;
  title: string;
  embed_url: string;
  platform: MixPlatform;
  description?: string | null;
  duration?: string | null;
  cover_image_url?: string | null;
  genres?: string[];
  sort_order?: number;
}

export interface MixUpdate {
  title?: string;
  description?: string | null;
  embed_url?: string;
  platform?: MixPlatform;
  duration?: string | null;
  cover_image_url?: string | null;
  genres?: string[];
  sort_order?: number;
}

export interface FollowRow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowInsert {
  follower_id: string;
  following_id: string;
}

export interface GenreTagRow {
  id: string;
  name: string;
  usage_count: number;
  created_at: string;
}

export interface ProfileFollowCountsRow {
  profile_id: string;
  followers_count: number;
  following_count: number;
}

/**
 * Minimal Database type for Supabase client generic.
 * Services should use the row/insert/update interfaces directly.
 */
export type Database = Record<string, unknown>;
