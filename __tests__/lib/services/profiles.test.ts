const mockRpc = jest.fn();
const mockGetUser = jest.fn();

/**
 * Build a fresh Supabase chain mock. Each `.from()` call returns
 * a chainable query builder that eventually terminates at
 * `.maybeSingle()` or `.single()`.
 */
function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    return chain;
  };

  const builders: ReturnType<typeof qb>[] = [];

  return {
    client: {
      from: jest.fn(() => {
        const b = qb();
        builders.push(b);
        return b;
      }),
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
    },
    /** Get the Nth query builder (0-indexed, in call order) */
    builder: (n: number) => builders[n],
    builders,
  };
}

let mock: ReturnType<typeof chainMock>;

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mock.client,
}));

import { profilesService } from "@/lib/services/profiles";

const MOCK_PROFILE = {
  id: "user-1",
  display_name: "DJ Shadow",
  slug: "dj-shadow",
  profile_type: "dj",
  profile_image_url: null,
  bio: null,
  city: null,
  state: null,
  country: null,
  genres: ["house"],
  social_links: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  deleted_at: null,
};

describe("profilesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  describe("getBySlug", () => {
    it("returns a profile when found", async () => {
      mock = chainMock();
      // Pre-configure the maybeSingle return for the first from() call
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({ data: MOCK_PROFILE, error: null });
        return b;
      }) as typeof origFrom;

      const result = await profilesService.getBySlug("dj-shadow");
      expect(result).toEqual(MOCK_PROFILE);
    });

    it("returns null when not found", async () => {
      const result = await profilesService.getBySlug("nobody");
      expect(result).toBeNull();
    });

    it("throws on error", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
        return b;
      }) as typeof origFrom;

      await expect(profilesService.getBySlug("fail")).rejects.toEqual({
        message: "DB error",
      });
    });
  });

  describe("getById", () => {
    it("returns a profile when found", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({ data: MOCK_PROFILE, error: null });
        return b;
      }) as typeof origFrom;

      const result = await profilesService.getById("user-1");
      expect(result).toEqual(MOCK_PROFILE);
    });
  });

  describe("getCurrent", () => {
    it("returns profile for authenticated user", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({ data: MOCK_PROFILE, error: null });
        return b;
      }) as typeof origFrom;

      const result = await profilesService.getCurrent();
      expect(result).toEqual(MOCK_PROFILE);
    });

    it("returns null when not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await profilesService.getCurrent();
      expect(result).toBeNull();
    });
  });

  describe("getFollowCounts", () => {
    it("returns counts from the view", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({
          data: { followers_count: 42, following_count: 10 },
          error: null,
        });
        return b;
      }) as typeof origFrom;

      const result = await profilesService.getFollowCounts("user-1");
      expect(result).toEqual({ followersCount: 42, followingCount: 10 });
    });

    it("returns zeros when no row exists", async () => {
      const result = await profilesService.getFollowCounts("user-1");
      expect(result).toEqual({ followersCount: 0, followingCount: 0 });
    });
  });

  describe("update", () => {
    it("updates profile fields without genres", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({
          data: { ...MOCK_PROFILE, display_name: "New Name" },
          error: null,
        });
        return b;
      }) as typeof origFrom;

      const result = await profilesService.update("user-1", {
        display_name: "New Name",
      });
      expect(result.display_name).toBe("New Name");
    });

    it("calls upsert_genre_tags RPC when genres change", async () => {
      let callIdx = 0;
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        callIdx++;
        if (callIdx === 1) {
          // First from() call: the main update
          b.single.mockResolvedValueOnce({ data: MOCK_PROFILE, error: null });
        }
        // Second from() call: genres update — default { data: null, error: null } is fine
        return b;
      }) as typeof origFrom;
      mockRpc.mockResolvedValueOnce({ data: ["techno"], error: null });

      const result = await profilesService.update("user-1", {
        genres: ["techno"],
      });

      expect(mockRpc).toHaveBeenCalledWith("upsert_genre_tags", {
        input_genres: ["techno"],
      });
      expect(result.genres).toEqual(["techno"]);
    });
  });
});
