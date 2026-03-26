import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetInbox = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  CONVERSATIONS_POLL_INTERVAL_MS: 30000,
  conversationsService: {
    getInbox: (...a: unknown[]) => mockGetInbox(...a),
  },
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: { id: "user-1" },
    loading: false,
  }),
}));

import { useConversations } from "@/hooks/use-conversations";

describe("useConversations", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("polls at 30s interval", async () => {
    mockGetInbox.mockResolvedValue([]);
    const { result } = renderHook(() => useConversations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetInbox).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockGetInbox).toHaveBeenCalledTimes(2);
  });
});
