export type { Database, Json } from "./database";

type Tables = import("./database").Database["public"]["Tables"];
type Views = import("./database").Database["public"]["Views"];
type Enums = import("./database").Database["public"]["Enums"];

export type City = Tables["cities"]["Row"];

/** Profile/event rows as returned from list/detail queries with FK embed. */
export type Profile = Tables["profiles"]["Row"] & {
  cities?: City | null;
};
export type Event = Tables["events"]["Row"] & {
  cities?: City | null;
};

/** Calendar list shape (flat city/state for UI; mapped in `eventsService.getEventsByDateRange`). */
export type CalendarEvent = Pick<
  Event,
  | "id"
  | "title"
  | "start_date"
  | "end_date"
  | "start_time"
  | "end_time"
  | "venue"
  | "flyer_image_url"
  | "genres"
  | "status"
  | "created_by"
  | "city_id"
> & {
  city: string | null;
  state: string | null;
};
export type EventLineup = Tables["event_lineup"]["Row"];
export type Conversation = Tables["conversations"]["Row"];
export type ConversationParticipant = Tables["conversation_participants"]["Row"];
export type Message = Tables["messages"]["Row"];
export type Comment = Tables["comments"]["Row"];
export type CommentLike = Tables["comment_likes"]["Row"];

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
export type CommentCounts = Views["comment_counts"]["Row"];

export interface MessageWithSender extends Message {
  sender: Pick<Profile, "id" | "display_name" | "slug" | "profile_image_url"> | null;
}

export interface ConversationInboxItem {
  id: string;
  type: ConversationType;
  event_id: string | null;
  updated_at: string | null;
  lastMessage: Pick<Message, "body" | "sender_id" | "created_at"> | null;
  unreadCount: number;
  otherParticipant: Pick<
    Profile,
    "id" | "display_name" | "slug" | "profile_image_url"
  > | null;
  event: Pick<
    Event,
    "id" | "title" | "flyer_image_url" | "status" | "deleted_at"
  > | null;
}

export interface CommentWithAuthor {
  id: string;
  body: string;
  created_at: string | null;
  updated_at: string | null;
  profile_id: string;
  author: Pick<Profile, "display_name" | "slug" | "profile_image_url"> | null;
  likeCount: number;
  likedByMe: boolean;
}

export interface CommentLikeState {
  liked: boolean;
  likeCount: number;
}

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
export type MessageUpdate = Tables["messages"]["Update"];

// Enum types
export type ProfileType = Enums["profile_type"];
export type EventStatus = Enums["event_status"];
export type ConversationType = Enums["conversation_type"];
export type CommentableType = Enums["commentable_type"];
export type MixPlatform = Enums["mix_platform"];
