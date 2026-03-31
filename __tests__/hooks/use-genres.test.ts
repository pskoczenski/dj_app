import { renderHook, waitFor } from "@testing-library/react";

const mockGetAll = jest.fn();

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}));

import { __private__, useGenres } from "@/hooks/use-genres";

describe("useGenres", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __private__.resetCacheForTests();
  });

  it("fetches all genres on mount", async () => {
    mockGetAll.mockResolvedValue([{ id: "g1", slug: "house", name: "House" }]);
    const { result } = renderHook(() => useGenres());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetAll).toHaveBeenCalledTimes(1);
    expect(result.current.genres).toHaveLength(1);
  });

  it("returns cached result on subsequent renders without refetching", async () => {
    mockGetAll.mockResolvedValue([{ id: "g1", slug: "house", name: "House" }]);

    const a = renderHook(() => useGenres());
    await waitFor(() => expect(a.result.current.loading).toBe(false));

    const b = renderHook(() => useGenres());
    await waitFor(() => expect(b.result.current.loading).toBe(false));

    expect(mockGetAll).toHaveBeenCalledTimes(1);
    expect(b.result.current.genres).toHaveLength(1);
  });
});

