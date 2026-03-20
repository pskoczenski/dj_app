import { renderHook, waitFor } from "@testing-library/react";

const MOCK_EVENT = {
  id: "evt-1",
  title: "Underground Session",
  start_date: "2025-06-15",
  status: "published",
};

const mockGetAll = jest.fn();

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}));

import { useEvents } from "@/hooks/use-events";

describe("useEvents", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads events on mount", async () => {
    mockGetAll.mockResolvedValueOnce([MOCK_EVENT]);

    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toEqual([MOCK_EVENT]);
    expect(result.current.error).toBeNull();
  });

  it("passes filters to getAll", async () => {
    mockGetAll.mockResolvedValueOnce([]);

    const { result } = renderHook(() =>
      useEvents({ state: "OR", sort: "soonest" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetAll).toHaveBeenCalledWith({ state: "OR", sort: "soonest" });
  });

  it("captures errors", async () => {
    mockGetAll.mockRejectedValueOnce(new Error("fetch failed"));

    const { result } = renderHook(() => useEvents());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe("fetch failed");
  });
});
