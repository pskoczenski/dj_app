import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationProvider } from "@/lib/location/location-provider";
import { useLocation } from "@/hooks/use-location";
import EventsPage from "@/app/(main)/events/page";
import type { City } from "@/types";

const mockReplace = jest.fn();
let searchParams = new URLSearchParams();
const mockGetAll = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => searchParams,
}));

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getEventsByDateRange: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("@/hooks/use-calendar-events", () => ({
  useCalendarEvents: () => ({
    events: [],
    eventsByDate: new Map(),
    loading: false,
    error: null,
    refetch: jest.fn(),
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

const portland: City = {
  id: "city-pdx",
  name: "Portland",
  state_name: "Oregon",
  state_code: "OR",
  created_at: "2025-01-01",
};

const austin: City = {
  id: "city-atx",
  name: "Austin",
  state_name: "Texas",
  state_code: "TX",
  created_at: "2025-01-01",
};

function ExploreAustinButton() {
  const { setActiveCity } = useLocation();
  return (
    <button type="button" onClick={() => setActiveCity(austin)}>
      Explore Austin
    </button>
  );
}

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

describe("Events page — Step 34 location filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue([]);
    searchParams = new URLSearchParams();
  });

  it("shows city-specific empty state when there are no events", async () => {
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Suspense fallback={null}>
          <EventsPage />
        </Suspense>
      </LocationProvider>,
    );

    await screen.findByRole("button", { name: /list view/i });

    expect(
      await screen.findByRole("heading", { name: /no events in portland yet/i }),
    ).toBeInTheDocument();
  });

  it("refetches with new cityId when active city changes", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Suspense fallback={null}>
          <EventsPage />
        </Suspense>
        <ExploreAustinButton />
      </LocationProvider>,
    );

    await screen.findByRole("button", { name: /list view/i });

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    expect(mockGetAll.mock.calls[0]?.[0]).toMatchObject({ cityId: "city-pdx" });

    mockGetAll.mockClear();

    await user.click(screen.getByRole("button", { name: /explore austin/i }));

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    expect(mockGetAll.mock.calls[0]?.[0]).toMatchObject({ cityId: "city-atx" });
  });
});
