import { TABLES, VIEWS, ENUMS } from "@/lib/db/schema-constants";

describe("Schema constants", () => {
  it("exports all required table names", () => {
    expect(TABLES).toEqual({
      cities: "cities",
      profiles: "profiles",
      events: "events",
      eventLikes: "event_likes",
      eventSaves: "event_saves",
      eventLineup: "event_lineup",
      conversations: "conversations",
      conversationParticipants: "conversation_participants",
      messages: "messages",
      comments: "comments",
      commentLikes: "comment_likes",
      mixes: "mixes",
      mixLikes: "mix_likes",
      follows: "follows",
      genres: "genres",
    });
  });

  it("exports the follow counts view", () => {
    expect(VIEWS.profileFollowCounts).toBe("profile_follow_counts");
    expect(VIEWS.commentCounts).toBe("comment_counts");
  });

  it("exports all enum type names", () => {
    expect(ENUMS).toEqual({
      profileType: "profile_type",
      eventStatus: "event_status",
      conversationType: "conversation_type",
      commentableType: "commentable_type",
      mixPlatform: "mix_platform",
    });
  });
});
