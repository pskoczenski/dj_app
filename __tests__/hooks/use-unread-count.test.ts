import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MessagingInboxProvider } from "@/hooks/messaging-inbox-provider";

const mockGetInbox = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  CONVERSATIONS_POLL_INTERVAL_MS: 30000,
  conversationsService: {
    getInbox: (...a: unknown[]) => mockGetInbox(...a),
  },
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
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("returns total unread and polls every 30s", async () => {
    mockGetInbox
      .mockResolvedValueOnce([{ unreadCount: 2 }, { unreadCount: 3 }])
      .mockResolvedValueOnce([{ unreadCount: 1 }]);

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: inboxWrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(5);

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockGetInbox).toHaveBeenCalledTimes(2);
  });
});
