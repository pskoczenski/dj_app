import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetMessages = jest.fn();
const mockSend = jest.fn();
const mockMarkAsRead = jest.fn();

jest.mock("@/lib/services/messages", () => ({
  DEFAULT_MESSAGES_PAGE_SIZE: 30,
  MESSAGES_POLL_INTERVAL_MS: 5000,
  messagesService: {
    getMessages: (...a: unknown[]) => mockGetMessages(...a),
    send: (...a: unknown[]) => mockSend(...a),
    deleteMessage: jest.fn(),
  },
}));

jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    markAsRead: (...a: unknown[]) => mockMarkAsRead(...a),
  },
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: {
      id: "user-1",
      displayName: "DJ Alpha",
      slug: "dj-alpha",
      avatarUrl: null,
    },
    loading: false,
  }),
}));

import { useMessages } from "@/hooks/use-messages";

describe("useMessages", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("loads messages and polls", async () => {
    mockGetMessages.mockResolvedValue([{ id: "m1", created_at: "2026-01-01T00:00:00.000Z" }]);
    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetMessages).toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(mockGetMessages).toHaveBeenCalledTimes(2);
  });

  it("sendMessage adds message optimistically", async () => {
    mockGetMessages.mockResolvedValue([]);
    mockSend.mockResolvedValue({
      id: "m2",
      conversation_id: "conv-1",
      sender_id: "user-1",
      body: "hi",
      created_at: "2026-01-01T00:00:01.000Z",
      deleted_at: null,
      sender: null,
    });

    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.sendMessage("hi");
    });

    expect(result.current.messages[0]?.body).toBe("hi");
  });
});
