import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: null,
    profile: null,
    hasAuthSession: true,
    loading: false,
  }),
}));

jest.mock("@/hooks/use-liked-event-ids", () => ({
  useLikedEventIds: () => new Set<string>(),
}));

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getUpcoming: jest.fn(),
    getByProfile: jest.fn(),
  },
}));

jest.mock("@/lib/services/mixes", () => ({
  mixesService: {
    getAll: jest.fn(),
  },
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    getFollowCounts: jest.fn(),
  },
}));

import HomePage from "@/app/(main)/home/page";

describe("HomePage when profile is missing", () => {
  it("does not stay on spinner and shows profile setup fallback", async () => {
    render(<HomePage />);

    expect(
      await screen.findByRole("heading", { name: /finish your profile setup/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open profile settings/i }),
    ).toHaveAttribute("href", "/profile/edit");
  });
});
