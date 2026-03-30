import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventsPage from "@/app/(main)/events/page";

const mockReplace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => searchParams,
}));

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getAll: jest.fn().mockResolvedValue([]),
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

describe("Events page view toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("defaults to list view and shows calendar when toggled", async () => {
    const user = userEvent.setup();
    render(
      <Suspense fallback={null}>
        <EventsPage />
      </Suspense>,
    );

    const listBtn = await screen.findByRole("button", { name: /list view/i });
    const calBtn = screen.getByRole("button", { name: /calendar view/i });

    expect(listBtn).toHaveAttribute("aria-pressed", "true");
    expect(calBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(calBtn);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("view=calendar"),
      expect.any(Object),
    );
  });

  it("shows calendar as selected when URL has view=calendar", async () => {
    searchParams = new URLSearchParams("view=calendar");
    render(
      <Suspense fallback={null}>
        <EventsPage />
      </Suspense>,
    );

    const calBtn = await screen.findByRole("button", { name: /calendar view/i });
    expect(calBtn).toHaveAttribute("aria-pressed", "true");
  });
});
