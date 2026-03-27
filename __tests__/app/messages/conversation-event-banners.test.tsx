import { render, screen, waitFor } from "@testing-library/react";
import ConversationPage from "@/app/(main)/messages/[conversationId]/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ conversationId: "c1" }),
}));

jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    getParticipants: jest.fn().mockResolvedValue([]),
  },
}));

const mockUseConversations = jest.fn();
jest.mock("@/hooks/use-conversations", () => ({
  useConversations: () => mockUseConversations(),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ user: { id: "u1" } }),
}));

const mockUseMessages = jest.fn();
jest.mock("@/hooks/use-messages", () => ({
  useMessages: () => mockUseMessages(),
}));

function baseConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    type: "event_group" as const,
    event_id: "e1",
    updated_at: null,
    lastMessage: null,
    unreadCount: 0,
    otherParticipant: null,
    event: {
      id: "e1",
      title: "Party",
      flyer_image_url: null,
      status: "published",
      deleted_at: null,
    },
    ...overrides,
  };
}

describe("ConversationPage event group banners", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMessages.mockReturnValue({
      messages: [],
      loading: false,
      hasMore: false,
      loadMore: jest.fn(),
      sendMessage: jest.fn(),
      sending: false,
    });
    mockUseConversations.mockReturnValue({
      conversations: [baseConversation()],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("shows cancelled banner for a cancelled linked event", async () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        baseConversation({
          event: {
            id: "e1",
            title: "Party",
            flyer_image_url: null,
            status: "cancelled",
            deleted_at: null,
          },
        }),
      ],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConversationPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/this event has been cancelled/i),
      ).toBeInTheDocument();
    });
  });

  it("shows removed banner when linked event is soft-deleted", async () => {
    mockUseConversations.mockReturnValue({
      conversations: [
        baseConversation({
          event: {
            id: "e1",
            title: "Party",
            flyer_image_url: null,
            status: "published",
            deleted_at: "2025-06-01T00:00:00.000Z",
          },
        }),
      ],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConversationPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/this event has been removed/i),
      ).toBeInTheDocument();
    });
  });
});
