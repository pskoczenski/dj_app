import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessagesInboxPage from "@/app/(main)/messages/page";

const mockUseConversations = jest.fn();
jest.mock("@/hooks/use-conversations", () => ({
  useConversations: () => mockUseConversations(),
}));

describe("Messages inbox page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders empty state when no conversations", () => {
    mockUseConversations.mockReturnValue({
      conversations: [],
      loading: false,
    });
    render(<MessagesInboxPage />);
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("renders DM and event group items", () => {
    mockUseConversations.mockReturnValue({
      loading: false,
      conversations: [
        {
          id: "c1",
          type: "dm",
          event_id: null,
          updated_at: "2026-01-01T00:00:00.000Z",
          lastMessage: { body: "Yo", sender_id: "u2", created_at: "2026-01-01T00:01:00.000Z" },
          unreadCount: 1,
          otherParticipant: {
            id: "u2",
            display_name: "DJ Beta",
            slug: "dj-beta",
            profile_image_url: null,
          },
          event: null,
        },
        {
          id: "c2",
          type: "event_group",
          event_id: "e1",
          updated_at: "2026-01-01T00:00:00.000Z",
          lastMessage: { body: "Set times updated", sender_id: "u3", created_at: "2026-01-01T00:01:00.000Z" },
          unreadCount: 0,
          otherParticipant: null,
          event: { id: "e1", title: "Warehouse Night", flyer_image_url: null },
        },
      ],
    });
    render(<MessagesInboxPage />);
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Night")).toBeInTheDocument();
  });

  it("clicking an item has conversation route href", async () => {
    const user = userEvent.setup();
    mockUseConversations.mockReturnValue({
      loading: false,
      conversations: [
        {
          id: "c1",
          type: "dm",
          event_id: null,
          updated_at: "2026-01-01T00:00:00.000Z",
          lastMessage: { body: "Yo", sender_id: "u2", created_at: "2026-01-01T00:01:00.000Z" },
          unreadCount: 1,
          otherParticipant: {
            id: "u2",
            display_name: "DJ Beta",
            slug: "dj-beta",
            profile_image_url: null,
          },
          event: null,
        },
      ],
    });
    render(<MessagesInboxPage />);
    const link = screen.getByRole("link", { name: /dj beta/i });
    expect(link).toHaveAttribute("href", "/messages/c1");
    await user.click(link);
  });
});
