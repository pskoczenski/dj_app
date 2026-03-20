import { renderHook, waitFor } from "@testing-library/react";

const MOCK_EVENT = {
  id: "evt-1",
  title: "Underground Session",
  start_date: "2025-06-15",
  status: "published",
};

const MOCK_LINEUP = [
  { id: "lu-1", event_id: "evt-1", profile_id: "user-1", sort_order: 0 },
];

const mockGetById = jest.fn();
const mockListForEvent = jest.fn();

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getById: (...args: unknown[]) => mockGetById(...args),
  },
}));

jest.mock("@/lib/services/event-lineup", () => ({
  eventLineupService: {
    listForEvent: (...args: unknown[]) => mockListForEvent(...args),
  },
}));

import { useEvent } from "@/hooks/use-event";

describe("useEvent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads event and lineup by id", async () => {
    mockGetById.mockResolvedValueOnce(MOCK_EVENT);
    mockListForEvent.mockResolvedValueOnce(MOCK_LINEUP);

    const { result } = renderHook(() => useEvent("evt-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.event).toEqual(MOCK_EVENT);
    expect(result.current.lineup).toEqual(MOCK_LINEUP);
    expect(result.current.error).toBeNull();
  });

  it("returns null event when not found", async () => {
    mockGetById.mockResolvedValueOnce(null);
    mockListForEvent.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useEvent("missing"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.event).toBeNull();
    expect(result.current.lineup).toEqual([]);
  });

  it("captures errors", async () => {
    mockGetById.mockRejectedValueOnce(new Error("not found"));
    mockListForEvent.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useEvent("evt-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe("not found");
  });
});
