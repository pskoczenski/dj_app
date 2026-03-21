import { renderHook, waitFor } from "@testing-library/react";

const MOCK_PROFILE = {
  id: "user-1",
  display_name: "DJ Shadow",
  slug: "dj-shadow",
  profile_type: "dj",
  profile_image_url: null,
};

const mockGetUser = jest.fn();
const mockGetById = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    getById: (...args: unknown[]) => mockGetById(...args),
  },
}));

import { useCurrentUser } from "@/hooks/use-current-user";

describe("useCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts loading then resolves with user", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockGetById.mockResolvedValueOnce(MOCK_PROFILE);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAuthSession).toBe(true);
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
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAuthSession).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("has session but no profile row still reports hasAuthSession", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockGetById.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAuthSession).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("captures auth errors", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe("JWT expired");
    expect(result.current.hasAuthSession).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("captures profile load errors while keeping session", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockGetById.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAuthSession).toBe(true);
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.user).toBeNull();
  });
});
