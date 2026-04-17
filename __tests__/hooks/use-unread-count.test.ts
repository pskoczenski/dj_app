import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagingInboxProvider } from "@/hooks/messaging-inbox-provider";

const mockGetInbox = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    getInbox: (...a: unknown[]) => mockGetInbox(...a),
  },
}));

const mockChannelObj = {
  on: jest.fn(() => mockChannelObj),
  subscribe: jest.fn(() => mockChannelObj),
};
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: jest.fn(() => mockChannelObj),
    removeChannel: jest.fn(),
  }),
}));

import { useUnreadCount } from "@/hooks/use-unread-count";

function inboxWrapper({ children }: { children: ReactNode }) {
  return createElement(
    MessagingInboxProvider,
    { userId: "user-1", userLoading: false },
    children,
  );
}

describe("useUnreadCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns total unread from inbox", async () => {
    mockGetInbox.mockResolvedValue([{ unreadCount: 2 }, { unreadCount: 3 }]);
    const { result } = renderHook(() => useUnreadCount(), { wrapper: inboxWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(5);
  });

  it("returns zero when inbox is empty", async () => {
    mockGetInbox.mockResolvedValue([]);
    const { result } = renderHook(() => useUnreadCount(), { wrapper: inboxWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(0);
  });
});
