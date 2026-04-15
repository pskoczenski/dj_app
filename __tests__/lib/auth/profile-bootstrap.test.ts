import { profileDefaultsFromAuthUser } from "@/lib/auth/profile-bootstrap";
import type { User } from "@supabase/supabase-js";

function makeUser(partial: Partial<User>): User {
  return {
    id: "u1",
    aud: "authenticated",
    role: "authenticated",
    email: "a@b.com",
    app_metadata: {},
    user_metadata: {},
    created_at: "",
    updated_at: "",
    ...partial,
  } as User;
}

describe("profileDefaultsFromAuthUser", () => {
  it("uses metadata when present", () => {
    const u = makeUser({
      user_metadata: { display_name: "DJ X", profile_type: "promoter" },
    });
    expect(profileDefaultsFromAuthUser(u)).toEqual({
      displayName: "DJ X",
      profileType: "promoter",
    });
  });

  it("falls back to email local part and dj", () => {
    const u = makeUser({ email: "hello@example.com", user_metadata: {} });
    expect(profileDefaultsFromAuthUser(u)).toEqual({
      displayName: "hello",
      profileType: "dj",
    });
  });

  it("accepts venue and producer metadata values", () => {
    const venueUser = makeUser({
      user_metadata: { display_name: "Club 99", profile_type: "venue" },
    });
    const producerUser = makeUser({
      user_metadata: { display_name: "Beat Crafter", profile_type: "producer" },
    });

    expect(profileDefaultsFromAuthUser(venueUser)).toEqual({
      displayName: "Club 99",
      profileType: "venue",
    });
    expect(profileDefaultsFromAuthUser(producerUser)).toEqual({
      displayName: "Beat Crafter",
      profileType: "producer",
    });
  });
});
