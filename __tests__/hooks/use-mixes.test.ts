import { renderHook, waitFor } from "@testing-library/react";

const MOCK_MIX = {
  id: "mix-1",
  title: "Summer Vibes",
  platform: "soundcloud",
  embed_url: "https://soundcloud.com/x/y",
};

const mockGetAll = jest.fn();

jest.mock("@/lib/services/mixes", () => ({
  mixesService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}));

import { useMixes } from "@/hooks/use-mixes";

describe("useMixes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads mixes on mount", async () => {
    mockGetAll.mockResolvedValueOnce([MOCK_MIX]);

    const { result } = renderHook(() => useMixes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.mixes).toEqual([MOCK_MIX]);
    expect(result.current.error).toBeNull();
  });

  it("passes filters to getAll", async () => {
    mockGetAll.mockResolvedValueOnce([]);

    const { result } = renderHook(() =>
      useMixes({ profileId: "user-1", sort: "order" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetAll).toHaveBeenCalledWith({
      profileId: "user-1",
      sort: "order",
    });
  });

  it("captures errors", async () => {
    mockGetAll.mockRejectedValueOnce(new Error("fetch failed"));

    const { result } = renderHook(() => useMixes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe("fetch failed");
  });
});
