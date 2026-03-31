import { render, screen } from "@testing-library/react";

const MOCK_USER = {
  id: "user-1",
  displayName: "DJ Alpha",
  slug: "dj-alpha",
  profileType: "dj",
  avatarUrl: null,
};

const MOCK_PROFILE = {
  id: "user-1",
  display_name: "DJ Alpha",
  slug: "dj-alpha",
  profile_type: "dj",
  profile_image_url: null,
  bio: null,
  city_id: "22222222-2222-4222-8222-222222222222",
  cities: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Portland",
    state_name: "Oregon",
    state_code: "OR",
    created_at: "2025-01-01",
  },
  country: null,
  genre_ids: [],
  social_links: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  deleted_at: null,
};

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: MOCK_USER,
    profile: MOCK_PROFILE,
    hasAuthSession: true,
    loading: false,
  }),
}));

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getUpcoming: jest.fn().mockResolvedValue([]),
    getByProfile: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("@/lib/services/mixes", () => ({
  mixesService: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    getFollowCounts: jest
      .fn()
      .mockResolvedValue({ followersCount: 5, followingCount: 3 }),
  },
}));

import HomePage from "@/app/(main)/home/page";

describe("HomePage", () => {
  it("renders the profile card with display name", async () => {
    render(<HomePage />);
    expect(await screen.findByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("@dj-alpha")).toBeInTheDocument();
  });

  it("shows the incomplete profile banner when bio is missing", async () => {
    render(<HomePage />);
    expect(
      await screen.findByText(/profile is incomplete/i),
    ).toBeInTheDocument();
  });

  it("renders Events Near You heading", async () => {
    render(<HomePage />);
    expect(
      await screen.findByRole("heading", { name: /events near you/i }),
    ).toBeInTheDocument();
  });

  it("renders Your Upcoming Gigs heading", async () => {
    render(<HomePage />);
    expect(
      await screen.findByRole("heading", { name: /your upcoming gigs/i }),
    ).toBeInTheDocument();
  });

  it("renders quick action links", async () => {
    render(<HomePage />);
    expect(await screen.findByText("Create Event")).toBeInTheDocument();
    expect(screen.getByText("Add Mix")).toBeInTheDocument();
  });

  it("shows View Profile link", async () => {
    render(<HomePage />);
    const link = await screen.findByRole("link", { name: /view profile/i });
    expect(link).toHaveAttribute("href", "/dj/dj-alpha");
  });
});
