import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetByRange = jest.fn();

jest.mock("@/lib/services/events", () => ({
  eventsService: {
    getEventsByDateRange: (...a: unknown[]) => mockGetByRange(...a),
  },
}));

import { useCalendarEvents } from "@/hooks/use-calendar-events";

describe("useCalendarEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetByRange.mockResolvedValue([]);
  });

  it("fetches on mount and exposes loading then results", async () => {
    mockGetByRange.mockResolvedValueOnce([
      {
        id: "e1",
        title: "A",
        start_date: "2026-04-15",
        end_date: null,
        start_time: null,
        end_time: null,
        venue: null,
        street_address: null,
        genre_ids: [],
        likes_count: 0,
        city_id: "22222222-2222-4222-8222-222222222222",
        city: null,
        state: null,
        flyer_image_url: null,
        genres: null,
        status: "published",
        created_by: "u1",
      },
    ]);

    const { result } = renderHook(() =>
      useCalendarEvents("2026-04-01", "2026-04-30"),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetByRange).toHaveBeenCalledWith("2026-04-01", "2026-04-30", {});
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]?.id).toBe("e1");
    expect(result.current.eventsByDate.get("2026-04-15")).toHaveLength(1);
  });

  it("re-fetches when the date range changes", async () => {
    const { result, rerender } = renderHook(
      ({ start, end }: { start: string; end: string }) =>
        useCalendarEvents(start, end),
      { initialProps: { start: "2026-04-01", end: "2026-04-30" } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetByRange).toHaveBeenCalledTimes(1);

    rerender({ start: "2026-05-01", end: "2026-05-31" });

    await waitFor(() =>
      expect(mockGetByRange).toHaveBeenLastCalledWith(
        "2026-05-01",
        "2026-05-31",
        {},
      ),
    );
    expect(mockGetByRange).toHaveBeenCalledTimes(2);
  });

  it("distributes a multi-day event in eventsByDate", async () => {
    mockGetByRange.mockResolvedValueOnce([
      {
        id: "span",
        title: "Fest",
        start_date: "2026-04-10",
        end_date: "2026-04-12",
        start_time: null,
        end_time: null,
        venue: null,
        street_address: null,
        genre_ids: [],
        likes_count: 0,
        city_id: "22222222-2222-4222-8222-222222222222",
        city: null,
        state: null,
        flyer_image_url: null,
        genres: null,
        status: "published",
        created_by: "u1",
      },
    ]);

    const { result } = renderHook(() =>
      useCalendarEvents("2026-04-01", "2026-04-30"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.eventsByDate.get("2026-04-10")?.[0]?.id).toBe("span");
    expect(result.current.eventsByDate.get("2026-04-11")?.[0]?.id).toBe("span");
    expect(result.current.eventsByDate.get("2026-04-12")?.[0]?.id).toBe("span");
  });

  it("ignores stale responses when the range changes quickly", async () => {
    let resolveSlow!: (v: unknown[]) => void;
    const slowPromise = new Promise<unknown[]>((r) => {
      resolveSlow = r;
    });
    mockGetByRange.mockReturnValueOnce(slowPromise).mockResolvedValueOnce([
      {
        id: "fresh",
        title: "B",
        start_date: "2026-06-01",
        end_date: null,
        start_time: null,
        end_time: null,
        venue: null,
        street_address: null,
        genre_ids: [],
        likes_count: 0,
        city_id: "22222222-2222-4222-8222-222222222222",
        city: null,
        state: null,
        flyer_image_url: null,
        genres: null,
        status: "published",
        created_by: "u1",
      },
    ]);

    const { result, rerender } = renderHook(
      ({ start, end }: { start: string; end: string }) =>
        useCalendarEvents(start, end),
      { initialProps: { start: "2026-04-01", end: "2026-04-30" } },
    );

    rerender({ start: "2026-06-01", end: "2026-06-30" });

    await act(async () => {
      resolveSlow([
        {
          id: "stale",
          title: "Old",
          start_date: "2026-04-05",
          end_date: null,
          start_time: null,
          end_time: null,
          venue: null,
          street_address: null,
          genre_ids: [],
          likes_count: 0,
          city_id: "22222222-2222-4222-8222-222222222222",
          city: null,
          state: null,
          flyer_image_url: null,
          genres: null,
          status: "published",
          created_by: "u1",
        },
      ]);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events[0]?.id).toBe("fresh");
  });

  it("passes cityId to getEventsByDateRange when provided", async () => {
    const cityId = "11111111-1111-4111-8111-111111111111";
    renderHook(() =>
      useCalendarEvents("2026-04-01", "2026-04-30", { cityId }),
    );

    await waitFor(() => expect(mockGetByRange).toHaveBeenCalled());
    expect(mockGetByRange).toHaveBeenCalledWith("2026-04-01", "2026-04-30", {
      cityId,
    });
  });

  it("passes genreIds to getEventsByDateRange when provided", async () => {
    renderHook(() =>
      useCalendarEvents("2026-04-01", "2026-04-30", {
        genreIds: ["g-house", "g-techno"],
      }),
    );

    await waitFor(() => expect(mockGetByRange).toHaveBeenCalled());
    expect(mockGetByRange).toHaveBeenCalledWith("2026-04-01", "2026-04-30", {
      genreIds: ["g-house", "g-techno"],
    });
  });

  it("refetch calls the service again", async () => {
    const { result } = renderHook(() =>
      useCalendarEvents("2026-04-01", "2026-04-30"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetByRange).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetByRange).toHaveBeenCalledTimes(2);
    expect(mockGetByRange).toHaveBeenLastCalledWith("2026-04-01", "2026-04-30", {});
  });
});
