import { TABLES, VIEWS, ENUMS } from "@/lib/db/schema-constants";

describe("Schema constants", () => {
  it("exports all required table names", () => {
    expect(TABLES).toEqual({
      profiles: "profiles",
      events: "events",
      eventLineup: "event_lineup",
      mixes: "mixes",
      follows: "follows",
      genreTags: "genre_tags",
    });
  });

  it("exports the follow counts view", () => {
    expect(VIEWS.profileFollowCounts).toBe("profile_follow_counts");
  });

  it("exports all enum type names", () => {
    expect(ENUMS).toEqual({
      profileType: "profile_type",
      eventStatus: "event_status",
      mixPlatform: "mix_platform",
    });
  });
});
