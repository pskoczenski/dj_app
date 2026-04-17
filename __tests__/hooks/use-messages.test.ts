import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetMessages = jest.fn();
const mockSend = jest.fn();
const mockMarkAsRead = jest.fn();

jest.mock("@/lib/services/messages", () => ({
  DEFAULT_MESSAGES_PAGE_SIZE: 30,
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

let capturedRealtimeCallback: ((payload: { new: Record<string, unknown> }) => void) | null = null;
const mockRemoveChannel = jest.fn();
const mockChannelObj = {
  on: jest.fn((_, __, cb) => {
    capturedRealtimeCallback = cb as typeof capturedRealtimeCallback;
    return mockChannelObj;
  }),
  subscribe: jest.fn(() => mockChannelObj),
};
const mockSupabaseClient = {
  channel: jest.fn(() => mockChannelObj),
  removeChannel: mockRemoveChannel,
};
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

import { useMessages } from "@/hooks/use-messages";

describe("useMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedRealtimeCallback = null;
    mockChannelObj.on.mockImplementation((_, __, cb) => {
      capturedRealtimeCallback = cb as typeof capturedRealtimeCallback;
      return mockChannelObj;
    });
  });

  it("loads messages on mount", async () => {
    mockGetMessages.mockResolvedValue([{ id: "m1", created_at: "2026-01-01T00:00:00.000Z" }]);
    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetMessages).toHaveBeenCalledTimes(1);
  });

  it("subscribes to realtime channel on mount", async () => {
    mockGetMessages.mockResolvedValue([]);
    renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockChannelObj.subscribe).toHaveBeenCalled());
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith("messages:conv-1");
  });

  it("refetches when realtime event arrives from another user", async () => {
    mockGetMessages.mockResolvedValue([]);
    renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(1));

    act(() => {
      capturedRealtimeCallback?.({ new: { sender_id: "other-user" } });
    });

    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(2));
  });

  it("does not refetch when realtime event is from the current user", async () => {
    mockGetMessages.mockResolvedValue([]);
    renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(1));

    act(() => {
      capturedRealtimeCallback?.({ new: { sender_id: "user-1" } });
    });

    // Give it a tick to ensure no additional call happened
    await new Promise((r) => setTimeout(r, 10));
    expect(mockGetMessages).toHaveBeenCalledTimes(1);
  });

  it("removes realtime channel on unmount", async () => {
    mockGetMessages.mockResolvedValue([]);
    const { unmount } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockChannelObj.subscribe).toHaveBeenCalled());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannelObj);
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
