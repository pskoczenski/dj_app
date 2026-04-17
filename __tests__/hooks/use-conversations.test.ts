import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagingInboxProvider } from "@/hooks/messaging-inbox-provider";

const mockGetInbox = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    getInbox: (...a: unknown[]) => mockGetInbox(...a),
  },
}));

const mockRemoveChannel = jest.fn();
const mockChannelObj = {
  on: jest.fn(() => mockChannelObj),
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
});
