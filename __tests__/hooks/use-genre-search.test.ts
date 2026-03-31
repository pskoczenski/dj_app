import { act, renderHook, waitFor } from "@testing-library/react";

const mockSearch = jest.fn();

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

import { useGenreSearch } from "@/hooks/use-genre-search";

describe("useGenreSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not fetch when query is fewer than 2 characters", async () => {
    const { result } = renderHook(() => useGenreSearch());

    act(() => result.current.setQuery("h"));
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("debounces search calls", async () => {
    mockSearch.mockResolvedValue([]);
    const { result } = renderHook(() => useGenreSearch());

    act(() => result.current.setQuery("ho"));
    act(() => result.current.setQuery("hou"));
    act(() => result.current.setQuery("hous"));
    act(() => {
      jest.advanceTimersByTime(249);
    });
    expect(mockSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2);
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
    expect(mockSearch).toHaveBeenCalledWith("hous", { excludeIds: undefined });
  });

  it("passes excludeIds to service", async () => {
    mockSearch.mockResolvedValue([]);
    const { result } = renderHook(() => useGenreSearch({ excludeIds: ["a"] }));

    act(() => result.current.setQuery("ho"));
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
    expect(mockSearch).toHaveBeenCalledWith("ho", { excludeIds: ["a"] });
  });

  it("clearResults resets query and results", async () => {
    mockSearch.mockResolvedValue([{ id: "g1", slug: "house", name: "House" }]);
    const { result } = renderHook(() => useGenreSearch());

    act(() => result.current.setQuery("ho"));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    act(() => result.current.clearResults());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
  });
});

