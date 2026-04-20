import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagingInboxProvider } from "@/hooks/messaging-inbox-provider";

const mockGetInbox = jest.fn();
const mockPatchInbox = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    getInbox: (...a: unknown[]) => mockGetInbox(...a),
    patchInboxAfterMessageInsert: (...a: unknown[]) => mockPatchInbox(...a),
  },
}));

let capturedMessagesInsert:
  | ((payload: { new: Record<string, unknown> }) => void)
  | null = null;
const mockRemoveChannel = jest.fn();
const mockChannelObj = {
  on: jest.fn((type: string, _filter: unknown, cb: unknown) => {
    if (type === "postgres_changes") {
      capturedMessagesInsert = cb as typeof capturedMessagesInsert;
    }
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

import { useConversations } from "@/hooks/use-conversations";

function inboxWrapper({ children }: { children: ReactNode }) {
  return createElement(
    MessagingInboxProvider,
    { userId: "user-1", userLoading: false },
    children,
  );
}

describe("useConversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMessagesInsert = null;
    mockChannelObj.on.mockImplementation((type: string, _filter: unknown, cb: unknown) => {
      if (type === "postgres_changes") {
        capturedMessagesInsert = cb as typeof capturedMessagesInsert;
      }
      return mockChannelObj;
    });
  });

  it("loads conversations on mount", async () => {
    mockGetInbox.mockResolvedValue([]);
    const { result } = renderHook(() => useConversations(), { wrapper: inboxWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetInbox).toHaveBeenCalledTimes(1);
  });

  it("subscribes to realtime inbox channel", async () => {
    mockGetInbox.mockResolvedValue([]);
    renderHook(() => useConversations(), { wrapper: inboxWrapper });
    await waitFor(() => expect(mockChannelObj.subscribe).toHaveBeenCalled());
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith("inbox:user-1");
  });

  it("removes channel when provider unmounts", async () => {
    mockGetInbox.mockResolvedValue([]);
    const { unmount } = renderHook(() => useConversations(), { wrapper: inboxWrapper });
    await waitFor(() => expect(mockChannelObj.subscribe).toHaveBeenCalled());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannelObj);
  });

  it("patches inbox on message insert instead of refetching full inbox", async () => {
    const initial = [
      {
        id: "conv-1",
        type: "dm" as const,
        event_id: null,
        updated_at: "2026-01-01T00:00:00.000Z",
        lastMessage: {
          body: "old",
          sender_id: "user-2",
          created_at: "2026-01-01T00:00:00.000Z",
        },
        unreadCount: 0,
        otherParticipant: {
          id: "user-2",
          display_name: "Beta",
          slug: "beta",
          profile_image_url: null,
        },
        event: null,
      },
    ];
    const patched = [
      {
        ...initial[0],
        updated_at: "2026-01-02T00:00:00.000Z",
        lastMessage: {
          body: "new",
          sender_id: "user-2",
          created_at: "2026-01-02T00:00:00.000Z",
        },
        unreadCount: 1,
      },
    ];
    mockGetInbox.mockResolvedValue(initial);
    mockPatchInbox.mockResolvedValue(patched);

    renderHook(() => useConversations(), { wrapper: inboxWrapper });
    await waitFor(() => expect(mockGetInbox).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(capturedMessagesInsert).not.toBeNull());

    await act(async () => {
      capturedMessagesInsert?.({
        new: {
          id: "m1",
          conversation_id: "conv-1",
          body: "new",
          sender_id: "user-2",
          created_at: "2026-01-02T00:00:00.000Z",
        },
      });
    });

    await waitFor(() => expect(mockPatchInbox).toHaveBeenCalled());
    expect(mockGetInbox).toHaveBeenCalledTimes(1);
  });
});
