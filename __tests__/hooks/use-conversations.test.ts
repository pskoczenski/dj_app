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
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("polls at 30s interval", async () => {
    mockGetInbox.mockResolvedValue([]);
    const { result } = renderHook(() => useConversations(), {
      wrapper: inboxWrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetInbox).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockGetInbox).toHaveBeenCalledTimes(2);
  });
});
