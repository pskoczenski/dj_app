import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConversationPage from "@/app/(main)/messages/[conversationId]/page";

const mockUseCurrentUser = jest.fn();
jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

const mockUseConversations = jest.fn();
jest.mock("@/hooks/use-conversations", () => ({
  useConversations: () => mockUseConversations(),
}));

const mockUseMessages = jest.fn();
jest.mock("@/hooks/use-messages", () => ({
  useMessages: (...a: unknown[]) => mockUseMessages(...a),
}));

const mockGetParticipants = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    getParticipants: (...a: unknown[]) => mockGetParticipants(...a),
  },
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ conversationId: "c1" }),
}));

describe("Conversation page", () => {
  function renderPage() {
    return render(<ConversationPage />);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({
      user: { id: "u1" },
    });
    mockUseConversations.mockReturnValue({
      conversations: [
        {
          id: "c1",
          type: "dm",
          event_id: null,
          updated_at: "2026-01-01T00:00:00.000Z",
          lastMessage: null,
          unreadCount: 0,
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
    mockUseMessages.mockReturnValue({
      messages: [
        {
          id: "m1",
          conversation_id: "c1",
          sender_id: "u1",
          body: "hello",
          created_at: "2026-01-01T00:00:00.000Z",
          deleted_at: null,
          sender: { id: "u1", display_name: "DJ Alpha", slug: "dj-alpha", profile_image_url: null },
        },
        {
          id: "m2",
          conversation_id: "c1",
          sender_id: "u2",
          body: "yo",
          created_at: "2026-01-01T00:01:00.000Z",
          deleted_at: null,
          sender: { id: "u2", display_name: "DJ Beta", slug: "dj-beta", profile_image_url: null },
        },
      ],
      loading: false,
      hasMore: true,
      loadMore: jest.fn(),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      sending: false,
      typingPeerIds: [],
      notifyTyping: jest.fn(),
    });
  });

  it("renders messages and own message alignment marker", async () => {
    renderPage();
    expect(await screen.findByText("hello")).toBeInTheDocument();
    expect(screen.getAllByTestId(/message-/)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
  });

  it("compose enter sends message", async () => {
    const user = userEvent.setup();
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    mockUseMessages.mockReturnValue({
      messages: [],
      loading: false,
      hasMore: false,
      loadMore: jest.fn(),
      sendMessage,
      sending: false,
      typingPeerIds: [],
      notifyTyping: jest.fn(),
    });
    renderPage();
    const input = screen.getByLabelText(/message input/i);
    await user.type(input, "test{enter}");
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith("test"));
  });

  it("send button disabled when input empty", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /send/i })).toBeDisabled();
  });
});
