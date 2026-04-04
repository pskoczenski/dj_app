import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ user: null }),
}));

jest.mock("@/hooks/use-liked-event-ids", () => ({
  useLikedEventIds: () => new Set<string>(),
}));

import { EventCalendarDayModal } from "@/components/events/event-calendar-day-modal";

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

jest.mock("@/components/events/event-card", () => ({
  EventCard: ({ event }: { event: { title: string } }) => (
    <div data-testid={`card-${event.title}`}>{event.title}</div>
  ),
}));

const EV = (title: string, id: string) => ({
  id,
  title,
  start_date: "2026-04-15",
  end_date: null,
  start_time: null,
  end_time: null,
  venue: null,
  city_id: "22222222-2222-4222-8222-222222222222",
  city: null,
  state: null,
  flyer_image_url: null,
  genre_ids: [] as string[],
  genres: null,
  likes_count: 0,
  street_address: null,
  status: "published" as const,
  created_by: "u1",
});

describe("EventCalendarDayModal", () => {
  it("shows formatted date in header and lists EventCards", async () => {
    const user = userEvent.setup();
    const day = new Date(2026, 3, 18, 12, 0, 0);
    const events = [EV("Alpha", "a"), EV("Beta", "b")];

    render(
      <EventCalendarDayModal
        date={day}
        events={events}
        trigger={<button type="button">Open day</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open day/i }));

    expect(
      screen.getByRole("heading", { name: /saturday, april 18, 2026/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("card-Alpha")).toBeInTheDocument();
    expect(screen.getByTestId("card-Beta")).toBeInTheDocument();
  });
});
