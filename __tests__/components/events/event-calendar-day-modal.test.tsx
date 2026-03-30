import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  city: null,
  state: null,
  flyer_image_url: null,
  genres: null,
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
