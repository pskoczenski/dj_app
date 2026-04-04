import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationProvider } from "@/lib/location/location-provider";
import type { City } from "@/types";
import EventsPage from "@/app/(main)/events/page";

const mockReplace = jest.fn();
let searchParams = new URLSearchParams();
const mockGetAll = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => searchParams,
  usePathname: () => "/events",
}));

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getEventsByDateRange: jest.fn().mockResolvedValue([]),
  },
}));

const mockUseCalendarEvents = jest.fn(() => ({
  events: [],
  eventsByDate: new Map(),
  loading: false,
  error: null,
  refetch: jest.fn(),
}));

jest.mock("@/hooks/use-calendar-events", () => ({
  useCalendarEvents: (...args: unknown[]) => mockUseCalendarEvents(...args),
}));

jest.mock("@/hooks/use-genres", () => ({
  useGenres: () => ({
    genres: [
      {
        id: "genre-house",
        name: "House",
        slug: "house",
        sort_order: 0,
        created_at: "2025-01-01",
      },
    ],
    loading: false,
  }),
}));

jest.mock("@/hooks/use-comment-count", () => ({
  useCommentCount: () => ({ count: 0, loading: false }),
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
  useCurrentUser: () => ({ user: null }),
}));

jest.mock("@/hooks/use-liked-event-ids", () => ({
  useLikedEventIds: () => new Set<string>(),
}));

const portland: City = {
  id: "city-pdx",
  name: "Portland",
  state_name: "Oregon",
  state_code: "OR",
  created_at: "2025-01-01",
};

beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
});

async function openFiltersAndSelectHouse(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /toggle filters/i }));
  await user.click(
    screen.getByRole("button", { name: /any genre\. open genre picker/i }),
  );
  await user.click(await screen.findByRole("option", { name: /^house$/i }));
}

describe("Events page — Step 37 genre filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue([]);
    searchParams = new URLSearchParams();
    mockUseCalendarEvents.mockImplementation(() => ({
      events: [],
      eventsByDate: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    }));
  });

  it("refetches with genreIds when a genre is chosen in filters", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Suspense fallback={null}>
          <EventsPage />
        </Suspense>
      </LocationProvider>,
    );

    await screen.findByRole("button", { name: /list view/i });
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    expect(mockGetAll.mock.calls[0]?.[0]).not.toHaveProperty("genreIds");

    mockGetAll.mockClear();
    await openFiltersAndSelectHouse(user);

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    expect(mockGetAll.mock.calls[0]?.[0]).toMatchObject({
      genreIds: ["genre-house"],
      cityId: "city-pdx",
    });
  });

  it("shows genre-specific empty state and clears filter from CTA", async () => {
    const user = userEvent.setup();
    mockGetAll.mockResolvedValue([]);
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Suspense fallback={null}>
          <EventsPage />
        </Suspense>
      </LocationProvider>,
    );

    await screen.findByRole("button", { name: /list view/i });
    await openFiltersAndSelectHouse(user);

    expect(
      await screen.findByRole("heading", {
        name: /no events matching these genres in portland/i,
      }),
    ).toBeInTheDocument();

    mockGetAll.mockClear();
    mockGetAll.mockResolvedValue([
      {
        id: "e1",
        title: "Party",
        created_by: "u1",
        start_date: "2026-06-01",
        status: "published",
        deleted_at: null,
        city_id: "city-pdx",
        cities: portland,
        genre_ids: [],
        likes_count: 0,
        street_address: null,
        event_lineup: [],
      },
    ]);

    await user.click(screen.getByRole("button", { name: /clear genre filter/i }));

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    expect(mockGetAll.mock.calls[0]?.[0]).not.toHaveProperty("genreIds");
    expect(await screen.findByText("Party")).toBeInTheDocument();
  });

  it("passes genreIds to calendar hook after switching to calendar view", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("view=calendar");

    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Suspense fallback={null}>
          <EventsPage />
        </Suspense>
      </LocationProvider>,
    );

    await screen.findByRole("button", { name: /calendar view/i });
    await user.click(
      screen.getByRole("button", { name: /any genre\. open genre picker/i }),
    );
    await user.click(await screen.findByRole("option", { name: /^house$/i }));

    await waitFor(() => {
      const calls = mockUseCalendarEvents.mock.calls;
      const last = calls[calls.length - 1];
      expect(last?.[2]).toMatchObject({
        cityId: "city-pdx",
        genreIds: ["genre-house"],
      });
    });
  });
});
