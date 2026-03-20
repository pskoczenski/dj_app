import { renderHook, waitFor } from "@testing-library/react";

const MOCK_PROFILE = {
  id: "user-1",
  display_name: "DJ Shadow",
  slug: "dj-shadow",
  profile_type: "dj",
  profile_image_url: null,
};

const mockGetBySlug = jest.fn();
const mockGetFollowCounts = jest.fn();

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    getBySlug: (...args: unknown[]) => mockGetBySlug(...args),
    getFollowCounts: (...args: unknown[]) => mockGetFollowCounts(...args),
  },
}));

import { useProfile } from "@/hooks/use-profile";

describe("useProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads profile and follow counts by slug", async () => {
    mockGetBySlug.mockResolvedValueOnce(MOCK_PROFILE);
    mockGetFollowCounts.mockResolvedValueOnce({
      followersCount: 10,
      followingCount: 5,
    });

    const { result } = renderHook(() => useProfile("dj-shadow"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toEqual(MOCK_PROFILE);
    expect(result.current.counts).toEqual({
      followersCount: 10,
      followingCount: 5,
    });
    expect(result.current.error).toBeNull();
  });

  it("returns null profile when not found", async () => {
    mockGetBySlug.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useProfile("nobody"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toBeNull();
    expect(result.current.counts).toEqual({
      followersCount: 0,
      followingCount: 0,
    });
  });

  it("captures errors", async () => {
    mockGetBySlug.mockRejectedValueOnce(new Error("DB error"));

    const { result } = renderHook(() => useProfile("dj-shadow"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe("DB error");
  });
});
