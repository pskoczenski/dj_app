import { render, screen } from "@testing-library/react";
import { EventCard } from "@/components/events/event-card";
import type { Event } from "@/types";

const MOCK_EVENT: Event = {
  id: "evt-1",
  title: "Underground Session",
  created_by: "user-1",
  start_date: "2025-06-15",
  status: "published",
  deleted_at: null,
  city: "Portland",
  state: "OR",
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
  ticket_url: null,
  venue: "Holocene",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

describe("EventCard", () => {
  it("renders title", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByText("Underground Session")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<EventCard event={MOCK_EVENT} />);
    expect(screen.getByText(/Jun 15, 2025/)).toBeInTheDocument();
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
});
