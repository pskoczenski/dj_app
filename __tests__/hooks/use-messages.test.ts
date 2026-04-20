import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetMessages = jest.fn();
const mockGetMessageWithSender = jest.fn();
const mockSend = jest.fn();
const mockMarkAsRead = jest.fn();

jest.mock("@/lib/services/messages", () => ({
  DEFAULT_MESSAGES_PAGE_SIZE: 30,
  messagesService: {
    getMessages: (...a: unknown[]) => mockGetMessages(...a),
    getMessageWithSender: (...a: unknown[]) => mockGetMessageWithSender(...a),
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

let capturedPostgresCallback: ((payload: { new: Record<string, unknown> }) => void) | null =
  null;
let capturedBroadcastCallback: ((payload: { payload?: { userId?: string } }) => void) | null =
  null;
const mockRemoveChannel = jest.fn();
const mockSendBroadcast = jest.fn().mockResolvedValue("ok");
const mockSubscribe = jest.fn((cb?: (status: string) => void) => {
  cb?.("SUBSCRIBED");
  return mockChannelObj;
});
const mockChannelObj = {
  on: jest.fn((type: string, _filter: unknown, cb: unknown) => {
    if (type === "postgres_changes") {
      capturedPostgresCallback = cb as typeof capturedPostgresCallback;
    } else if (type === "broadcast") {
      capturedBroadcastCallback = cb as typeof capturedBroadcastCallback;
    }
    return mockChannelObj;
  }),
  subscribe: mockSubscribe,
  send: mockSendBroadcast,
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
    capturedPostgresCallback = null;
    capturedBroadcastCallback = null;
    mockChannelObj.on.mockImplementation((type: string, _filter: unknown, cb: unknown) => {
      if (type === "postgres_changes") {
        capturedPostgresCallback = cb as typeof capturedPostgresCallback;
      } else if (type === "broadcast") {
        capturedBroadcastCallback = cb as typeof capturedBroadcastCallback;
      }
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
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      "messages:conv-1",
      expect.objectContaining({
        config: { broadcast: { self: false } },
      }),
    );
  });

  it("merges single message when realtime insert is from another user", async () => {
    mockGetMessages.mockResolvedValue([]);
    const merged = {
      id: "m-new",
      conversation_id: "conv-1",
      sender_id: "other-user",
      body: "yo",
      created_at: "2026-01-02T00:00:00.000Z",
      deleted_at: null,
      sender: { id: "other-user", display_name: "Other", slug: "o", profile_image_url: null },
    };
    mockGetMessageWithSender.mockResolvedValue(merged);

    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(1));

    await act(async () => {
      capturedPostgresCallback?.({
        new: { id: "m-new", sender_id: "other-user" },
      });
    });

    await waitFor(() => expect(mockGetMessageWithSender).toHaveBeenCalledWith("m-new"));
    expect(mockGetMessages).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.messages[0]?.id).toBe("m-new"));
  });

  it("falls back to refetch when getMessageWithSender returns null", async () => {
    mockGetMessages.mockResolvedValue([]);
    mockGetMessageWithSender.mockResolvedValue(null);

    renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(1));

    await act(async () => {
      capturedPostgresCallback?.({
        new: { id: "m-new", sender_id: "other-user" },
      });
    });

    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(2));
  });

  it("does not refetch when realtime event is from the current user", async () => {
    mockGetMessages.mockResolvedValue([]);
    renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockGetMessages).toHaveBeenCalledTimes(1));

    await act(async () => {
      capturedPostgresCallback?.({ new: { sender_id: "user-1", id: "m1" } });
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockGetMessages).toHaveBeenCalledTimes(1);
    expect(mockGetMessageWithSender).not.toHaveBeenCalled();
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

  it("tracks typing peers from broadcast", async () => {
    mockGetMessages.mockResolvedValue([]);
    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(capturedBroadcastCallback).not.toBeNull());

    await act(async () => {
      capturedBroadcastCallback?.({ payload: { userId: "other-user", active: true } });
    });

    await waitFor(() => expect(result.current.typingPeerIds).toContain("other-user"));
  });

  it("clears typing peer when broadcast sends active false", async () => {
    mockGetMessages.mockResolvedValue([]);
    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(capturedBroadcastCallback).not.toBeNull());

    await act(async () => {
      capturedBroadcastCallback?.({ payload: { userId: "other-user", active: true } });
    });
    await waitFor(() => expect(result.current.typingPeerIds).toContain("other-user"));

    await act(async () => {
      capturedBroadcastCallback?.({ payload: { userId: "other-user", active: false } });
    });
    await waitFor(() =>
      expect(result.current.typingPeerIds).not.toContain("other-user"),
    );
  });

  it("notifyTyping sends broadcast when subscribed", async () => {
    mockGetMessages.mockResolvedValue([]);
    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());

    await act(async () => {
      result.current.notifyTyping();
    });

    expect(mockSendBroadcast).toHaveBeenCalledWith({
      type: "broadcast",
      event: "typing",
      payload: { userId: "user-1", active: true },
    });
  });

  it("notifyTyping(false) sends stop signal without throttle", async () => {
    mockGetMessages.mockResolvedValue([]);
    const { result } = renderHook(() => useMessages("conv-1"));
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
    mockSendBroadcast.mockClear();

    await act(async () => {
      result.current.notifyTyping(false);
    });

    expect(mockSendBroadcast).toHaveBeenCalledWith({
      type: "broadcast",
      event: "typing",
      payload: { userId: "user-1", active: false },
    });
  });
});
