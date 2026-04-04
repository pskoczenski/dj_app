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
    chain.overlaps = jest.fn().mockReturnValue(chain);
    chain.or = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.limit = jest.fn().mockResolvedValue({ data: [], error: null });
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

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    hydrateGenreLabels: jest.fn(
      async (rows: Record<string, unknown>[]) =>
        rows.map((r) => ({
          ...r,
          genres: ["house"],
        })),
    ),
    resolveLabelsToIds: jest.fn(),
    resolveFilterTokenToId: jest.fn(),
    getIdToNameMap: jest.fn(),
    labelToSlug: jest.fn(),
  },
}));

import { profilesService } from "@/lib/services/profiles";

const MOCK_PROFILE = {
  id: "user-1",
  display_name: "DJ Shadow",
  slug: "dj-shadow",
  profile_type: "dj",
  profile_image_url: null,
  bio: null,
  city_id: "22222222-2222-4222-8222-222222222222",
  cities: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Portland",
    state_name: "Oregon",
    state_code: "OR",
    created_at: "2024-01-01",
  },
  country: null,
  genre_ids: [] as string[],
  social_links: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  deleted_at: null,
};

const MOCK_PROFILE_ENRICHED = { ...MOCK_PROFILE, genres: ["house"] as string[] };

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
      expect(result).toEqual(MOCK_PROFILE_ENRICHED);
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
      expect(result).toEqual(MOCK_PROFILE_ENRICHED);
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
      expect(result).toEqual(MOCK_PROFILE_ENRICHED);
    });

    it("returns null when not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await profilesService.getCurrent();
      expect(result).toBeNull();
    });
  });

  describe("search", () => {
    it("applies cityId when provided", async () => {
      mock = chainMock();
      await profilesService.search("dj", { cityId: "city-1" });

      const b = mock.builder(0);
      expect(b.eq).toHaveBeenCalledWith("city_id", "city-1");
      expect(b.limit).toHaveBeenCalledWith(10);
    });

    it("does not apply city_id when cityId omitted", async () => {
      mock = chainMock();
      await profilesService.search("dj");

      const b = mock.builder(0);
      const cityCalls = (b.eq as jest.Mock).mock.calls.filter(
        (c: unknown[]) => c[0] === "city_id",
      );
      expect(cityCalls).toHaveLength(0);
    });

    it("applies genreIds via overlaps when provided", async () => {
      mock = chainMock();
      await profilesService.search("dj", { genreIds: ["g1", "g2"] });

      const b = mock.builder(0);
      expect(b.overlaps).toHaveBeenCalledWith("genre_ids", ["g1", "g2"]);
    });

    it("returns empty array when query is too short and no genreIds", async () => {
      mock = chainMock();
      const result = await profilesService.search("x");
      expect(result).toEqual([]);
      expect(mock.client.from).not.toHaveBeenCalled();
    });

    it("runs genre-only query when genreIds set and query is empty", async () => {
      mock = chainMock();
      await profilesService.search("", { genreIds: ["g1"] });

      const b = mock.builder(0);
      expect(b.overlaps).toHaveBeenCalledWith("genre_ids", ["g1"]);
      expect(b.or).not.toHaveBeenCalled();
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
    it("updates profile fields", async () => {
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

    it("updates genre_ids in a single update round-trip", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({
          data: { ...MOCK_PROFILE, genre_ids: ["uuid-techno"] },
          error: null,
        });
        return b;
      }) as typeof origFrom;

      const result = await profilesService.update("user-1", {
        genre_ids: ["uuid-techno"],
      });

      const b = mock.builder(0);
      expect(b.update).toHaveBeenCalledWith({ genre_ids: ["uuid-techno"] });
      expect(result.genre_ids).toEqual(["uuid-techno"]);
      expect(result.genres).toEqual(["house"]);
    });
  });
});
