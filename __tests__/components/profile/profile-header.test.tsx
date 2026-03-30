import { render, screen } from "@testing-library/react";
import { ProfileHeader } from "@/components/profile/profile-header";
import type { Profile } from "@/types";
import type { FollowCounts } from "@/lib/services/profiles";

const profile: Profile = {
  id: "user-1",
  display_name: "DJ Shadow",
  slug: "dj-shadow",
  bio: "Underground house music.",
  city_id: "city-bk",
  cities: {
    id: "city-bk",
    name: "Brooklyn",
    state_name: "New York",
    state_code: "NY",
    created_at: "2024-01-01",
  },
  country: "US",
  genres: ["house", "techno"],
  profile_type: "dj",
  profile_image_url: null,
  social_links: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  deleted_at: null,
};

const counts: FollowCounts = { followersCount: 42, followingCount: 10 };

describe("ProfileHeader", () => {
  it("renders display name and slug", () => {
    render(<ProfileHeader profile={profile} counts={counts} />);
    expect(screen.getByText("DJ Shadow")).toBeInTheDocument();
    expect(screen.getByText("@dj-shadow")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<ProfileHeader profile={profile} counts={counts} />);
    expect(screen.getByText("Brooklyn, NY, US")).toBeInTheDocument();
  });

  it("renders bio", () => {
    render(<ProfileHeader profile={profile} counts={counts} />);
    expect(screen.getByText("Underground house music.")).toBeInTheDocument();
  });

  it("renders genre badges", () => {
    render(<ProfileHeader profile={profile} counts={counts} />);
    expect(screen.getByText("house")).toBeInTheDocument();
    expect(screen.getByText("techno")).toBeInTheDocument();
  });

  it("renders follow counts", () => {
    render(<ProfileHeader profile={profile} counts={counts} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/followers/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/following/)).toBeInTheDocument();
  });

  it("renders initials when no avatar", () => {
    render(<ProfileHeader profile={profile} counts={counts} />);
    expect(screen.getByText("DS")).toBeInTheDocument();
  });
});
