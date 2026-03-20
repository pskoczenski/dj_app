import { renderHook, waitFor } from "@testing-library/react";

const MOCK_PROFILE = {
  id: "user-1",
  display_name: "DJ Shadow",
  slug: "dj-shadow",
  profile_type: "dj",
  profile_image_url: null,
};

const mockGetCurrent = jest.fn();

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    getCurrent: (...args: unknown[]) => mockGetCurrent(...args),
  },
}));

import { useCurrentUser } from "@/hooks/use-current-user";

describe("useCurrentUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("starts loading then resolves with user", async () => {
    mockGetCurrent.mockResolvedValueOnce(MOCK_PROFILE);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual({
      id: "user-1",
      displayName: "DJ Shadow",
      slug: "dj-shadow",
      avatarUrl: null,
      profileType: "dj",
    });
    expect(result.current.error).toBeNull();
  });

  it("returns null user when not authenticated", async () => {
    mockGetCurrent.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it("captures errors", async () => {
    mockGetCurrent.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.user).toBeNull();
  });
});
