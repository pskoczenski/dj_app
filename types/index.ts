export type { Database, Json } from "./database";

type Tables = import("./database").Database["public"]["Tables"];
type Views = import("./database").Database["public"]["Views"];
type Enums = import("./database").Database["public"]["Enums"];

// Row types
export type Profile = Tables["profiles"]["Row"];
export type Event = Tables["events"]["Row"];
export type EventLineup = Tables["event_lineup"]["Row"];

/** Embedded lineup row on event list/card queries (minimal profile fields). */
export type EventLineupCardPreview = Pick<EventLineup, "sort_order"> & {
  profile: Pick<Profile, "display_name" | "slug"> | null;
};

/** Event row with optional nested lineup for cards and browse lists. */
export type EventWithLineupPreview = Event & {
  event_lineup?: EventLineupCardPreview[] | null;
};

/** Lineup row from `listForEvent` with embedded DJ profile. */
export type EventLineupWithProfile = EventLineup & {
  profile: Pick<
    Profile,
    "id" | "display_name" | "slug" | "profile_image_url" | "genres"
  > | null;
};

export type Mix = Tables["mixes"]["Row"];

/** Mix row with DJ profile from list queries (`getAll`, `getByProfile`). */
export type MixWithCreator = Mix & {
  creator?: Pick<Profile, "display_name" | "slug"> | null;
};

export type Follow = Tables["follows"]["Row"];
export type GenreTag = Tables["genre_tags"]["Row"];
export type ProfileFollowCounts = Views["profile_follow_counts"]["Row"];

// Insert types
export type ProfileInsert = Tables["profiles"]["Insert"];
export type EventInsert = Tables["events"]["Insert"];
export type EventLineupInsert = Tables["event_lineup"]["Insert"];
export type MixInsert = Tables["mixes"]["Insert"];
export type FollowInsert = Tables["follows"]["Insert"];

// Update types
export type ProfileUpdate = Tables["profiles"]["Update"];
export type EventUpdate = Tables["events"]["Update"];
export type MixUpdate = Tables["mixes"]["Update"];

// Enum types
export type ProfileType = Enums["profile_type"];
export type EventStatus = Enums["event_status"];
export type MixPlatform = Enums["mix_platform"];
