import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCalendar } from "@/components/events/event-calendar";

jest.mock("@/hooks/use-location", () => ({
  useLocation: () => ({
    activeCity: {
      id: "city-cal",
      name: "Portland",
      state_name: "Oregon",
      state_code: "OR",
      created_at: "2025-01-01",
    },
    homeCity: {
      id: "city-cal",
      name: "Portland",
      state_name: "Oregon",
      state_code: "OR",
      created_at: "2025-01-01",
    },
    isExploring: false,
    setActiveCity: jest.fn(),
    resetToHome: jest.fn(),
  }),
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
});

const mockUseCalendarEvents = jest.fn();
jest.mock("@/hooks/use-calendar-events", () => ({
  useCalendarEvents: (...a: unknown[]) => mockUseCalendarEvents(...a),
}));

jest.mock("@/components/events/event-preview-modal", () => ({
  EventPreviewModal: ({
    event,
    trigger,
  }: {
    event: { title: string };
    trigger: React.ReactElement;
  }) => (
    <div data-testid={`preview-${event.title}`}>
      {trigger}
    </div>
  ),
}));

jest.mock("@/components/events/event-calendar-day-modal", () => ({
  EventCalendarDayModal: ({
    trigger,
  }: {
    trigger: React.ReactElement;
  }) => <div data-testid="day-modal">{trigger}</div>,
}));

const baseEvent = {
  id: "e1",
  title: "Warehouse Night",
  start_date: "2026-04-15",
  end_date: null,
  start_time: null,
  end_time: null,
  venue: null,
  street_address: null,
  city_id: "22222222-2222-4222-8222-222222222222",
  city: null,
  state: null,
  flyer_image_url: null,
  genre_ids: [] as string[],
  genres: null,
  likes_count: 0,
  status: "published" as const,
  created_by: "u1",
};

describe("EventCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCalendarEvents.mockReturnValue({
      events: [],
      eventsByDate: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("renders month and year in the header", () => {
    render(<EventCalendar initialMonth={new Date(2026, 3, 1)} />);
    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("renders seven day-of-week column headers", () => {
    render(<EventCalendar initialMonth={new Date(2026, 3, 1)} />);
    expect(screen.getByRole("columnheader", { name: "Mon" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Sun" })).toBeInTheDocument();
  });

  it("renders event titles on matching dates from useCalendarEvents", () => {
    mockUseCalendarEvents.mockReturnValue({
      events: [baseEvent],
      eventsByDate: new Map([["2026-04-15", [baseEvent]]]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<EventCalendar initialMonth={new Date(2026, 3, 1)} />);

    expect(screen.getByRole("button", { name: /warehouse night/i })).toBeInTheDocument();
  });

  it("navigates months and re-fetches via useCalendarEvents", async () => {
    const user = userEvent.setup();
    render(<EventCalendar initialMonth={new Date(2026, 3, 1)} />);

    expect(mockUseCalendarEvents).toHaveBeenCalled();
    const firstRange = mockUseCalendarEvents.mock.calls[0];
    expect(firstRange?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(firstRange?.[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(firstRange?.[2]).toEqual({ cityId: "city-cal" });

    await user.click(screen.getByRole("button", { name: /next month/i }));

    expect(screen.getByText("May 2026")).toBeInTheDocument();
    expect(mockUseCalendarEvents.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("shows Today when not on the current month", () => {
    render(<EventCalendar initialMonth={new Date(2020, 0, 1)} />);
    expect(screen.getByRole("button", { name: /^today$/i })).toBeInTheDocument();
  });

  it("shows +N more when a day exceeds the desktop title limit", () => {
    const events = Array.from({ length: 5 }, (_, i) => ({
      ...baseEvent,
      id: `e${i}`,
      title: `Event ${i}`,
    }));
    mockUseCalendarEvents.mockReturnValue({
      events,
      eventsByDate: new Map([["2026-04-15", events]]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<EventCalendar initialMonth={new Date(2026, 3, 1)} />);

    expect(
      screen.getByRole("button", { name: /show 2 more events on april 15/i }),
    ).toBeInTheDocument();
  });

  it("shows city-scoped empty copy when the month has no events", () => {
    mockUseCalendarEvents.mockReturnValue({
      events: [],
      eventsByDate: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<EventCalendar initialMonth={new Date(2026, 3, 1)} />);

    expect(
      screen.getByText(/no events in portland this month/i),
    ).toBeInTheDocument();
  });

  it("passes selectedGenreIds to useCalendarEvents", () => {
    mockUseCalendarEvents.mockReturnValue({
      events: [],
      eventsByDate: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <EventCalendar
        initialMonth={new Date(2026, 3, 1)}
        selectedGenreIds={["g1"]}
      />,
    );

    expect(mockUseCalendarEvents).toHaveBeenCalled();
    const opts = mockUseCalendarEvents.mock.calls[0]?.[2];
    expect(opts).toEqual({ cityId: "city-cal", genreIds: ["g1"] });
  });

  it("shows genre-aware empty copy when genres are selected", () => {
    mockUseCalendarEvents.mockReturnValue({
      events: [],
      eventsByDate: new Map(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <EventCalendar
        initialMonth={new Date(2026, 3, 1)}
        selectedGenreIds={["g1"]}
      />,
    );

    expect(
      screen.getByText(/no events matching these genres in portland this month/i),
    ).toBeInTheDocument();
  });

  it("shows loading skeletons in cells while loading", () => {
    mockUseCalendarEvents.mockReturnValue({
      events: [],
      eventsByDate: new Map(),
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = render(
      <EventCalendar initialMonth={new Date(2026, 3, 1)} />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });
});
