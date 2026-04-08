import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/events",
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ user: null }),
}));

jest.mock("@/hooks/use-liked-event-ids", () => ({
  useLikedEventIds: () => new Set<string>(),
}));

jest.mock("@/hooks/use-comment-count", () => ({
  useCommentCount: () => ({ count: 0, loading: false }),
}));

import { EventPreviewModal } from "@/components/events/event-preview-modal";

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

const EVENT = {
  id: "evt-1",
  title: "Night Market",
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
  admission: null,
  is_ticketed: false,
  street_address: null,
  status: "published" as const,
  created_by: "u1",
};

describe("EventPreviewModal", () => {
  it("opens and shows EventCard with event data", async () => {
    const user = userEvent.setup();
    render(
      <EventPreviewModal
        event={EVENT}
        trigger={<button type="button">Open preview</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open preview/i }));

    expect(
      await screen.findByRole("heading", { name: "Night Market" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view event/i })).toBeNull();
  });
});
