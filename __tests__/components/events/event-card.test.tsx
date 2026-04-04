import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCard } from "@/components/events/event-card";
import type { EventWithLineupPreview } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/events",
}));

jest.mock("@/lib/services/event-likes", () => ({
  eventLikesService: {
    getLikedEventIdsForUser: jest.fn(),
    toggleLike: jest.fn(),
  },
}));

jest.mock("@/hooks/use-comment-count", () => ({
  useCommentCount: () => ({ count: 3, loading: false }),
}));

jest.mock("@/hooks/use-comments", () => ({
  useComments: () => ({
    comments: [],
    totalCount: 0,
    loading: false,
    hasMore: false,
    loadMore: jest.fn(),
    addComment: jest.fn().mockResolvedValue(undefined),
    deleteComment: jest.fn(),
    refetch: jest.fn(),
    error: null,
  }),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ user: { id: "u-test" } }),
}));

const MOCK_EVENT: EventWithLineupPreview = {
  id: "evt-1",
  title: "Underground Session",
  created_by: "user-1",
  start_date: "2025-06-15",
  status: "published",
  deleted_at: null,
  city_id: "city-pdx",
  cities: {
    id: "city-pdx",
    name: "Portland",
    state_name: "Oregon",
    state_code: "OR",
    created_at: "2025-01-01",
  },
  country: "US",
  description: null,
  end_date: null,
  start_time: null,
  end_time: null,
  flyer_image_url: null,
  genres: ["techno", "house"],
  google_place_id: null,
  latitude: null,
  longitude: null,
  likes_count: 7,
  ticket_url: null,
  venue: "Holocene",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  genre_ids: [],
};

describe("EventCard", () => {
  it("renders title", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByText("Underground Session")).toBeInTheDocument();
  });

  it("renders lineup DJs under the title when present", () => {
    render(
      <EventCard
        event={{
          ...MOCK_EVENT,
          event_lineup: [
            {
              sort_order: 0,
              profile: { display_name: "DJ Alpha", slug: "dj-alpha" },
            },
            {
              sort_order: 1,
              profile: { display_name: "DJ Beta", slug: "dj-beta" },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(/DJ Alpha · DJ Beta/)).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByText(/Jun 15, 2025/)).toBeInTheDocument();
  });

  it("renders start and end times in 12-hour form when set", () => {
    render(
      <EventCard
        event={{
          ...MOCK_EVENT,
          start_time: "21:00:00",
          end_time: "02:30:00",
        }}
      />,
    );
    expect(
      screen.getByText(/Jun 15, 2025 · 9:00 PM – 2:30 AM/),
    ).toBeInTheDocument();
  });

  it("renders venue and city", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByText(/Holocene, Portland, OR/)).toBeInTheDocument();
  });

  it("renders genre badges", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByText("techno")).toBeInTheDocument();
    expect(screen.getByText("house")).toBeInTheDocument();
  });

  it("shows status badge for cancelled events", () => {
    render(<EventCard event={{ ...MOCK_EVENT, status: "cancelled" }} />);
    expect(screen.getByText("cancelled")).toBeInTheDocument();
  });

  it("does not show status badge for published events", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.queryByText("published")).not.toBeInTheDocument();
  });

  it("links to event detail page", () => {
    render(<EventCard event={MOCK_EVENT} />);
    const link = screen.getByRole("link", { name: /underground session/i });
    expect(link).toHaveAttribute("href", "/events/evt-1");
  });

  it("renders semantic article wrapper", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("renders like control with count", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByRole("button", { name: /like this event/i })).toHaveTextContent(
      "7",
    );
  });

  it("renders comment count trigger and opens comments dialog", async () => {
    const user = userEvent.setup();
    render(<EventCard event={MOCK_EVENT} />);

    const badge = screen.getByRole("button", { name: /3 comments/i });
    expect(badge).toHaveTextContent("3");

    await user.click(badge);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /underground session/i }),
    ).toBeInTheDocument();
  });
});
