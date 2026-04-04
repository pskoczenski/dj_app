function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.gte = jest.fn().mockReturnValue(chain);
    chain.lte = jest.fn().mockReturnValue(chain);
    chain.in = jest.fn().mockReturnValue(chain);
    chain.contains = jest.fn().mockReturnValue(chain);
    chain.overlaps = jest.fn().mockReturnValue(chain);
    chain.or = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.range = jest.fn().mockReturnValue(chain);
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
    chain.delete = jest.fn().mockReturnValue(chain);
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.then = undefined;
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
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
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
          genres: ["techno"],
        })),
    ),
    getIdToNameMap: jest.fn(async (ids: string[]) => {
      const m = new Map<string, string>();
      for (const id of ids) m.set(id, "techno");
      return m;
    }),
    resolveFilterTokenToId: jest.fn(async (token: string) =>
      token === "techno" ? "genre-uuid-techno" : null,
    ),
    resolveLabelsToIds: jest.fn(),
    labelToSlug: jest.fn(),
  },
}));

import { eventsService, eventListWithLineupSelect } from "@/lib/services/events";

const MOCK_EVENT = {
  id: "evt-1",
  title: "Underground Session",
  created_by: "user-1",
  start_date: "2025-06-15",
  status: "published",
  deleted_at: null,
  city_id: "city-portland",
  cities: {
    id: "city-portland",
    name: "Portland",
    state_code: "OR",
    state_name: "Oregon",
    created_at: "2025-01-01",
  },
  country: "US",
  description: null,
  end_date: null,
  start_time: null,
  end_time: null,
  flyer_image_url: null,
  genres: ["techno"],
  google_place_id: null,
  latitude: null,
  longitude: null,
  likes_count: 0,
  ticket_url: null,
  venue: null,
  street_address: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  genre_ids: [],
};

describe("eventsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  describe("getAll", () => {
    it("returns published, non-deleted events with default sort", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        // Make the chain thenable by resolving the final result
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [MOCK_EVENT], error: null });
        return b;
      }) as typeof origFrom;

      const result = await eventsService.getAll();
      expect(result).toEqual([{ ...MOCK_EVENT, genres: ["techno"] }]);
      expect(mock.client.from).toHaveBeenCalledWith("events");
      const builder = mock.builder(0);
      expect(builder.select).toHaveBeenCalledWith(
        eventListWithLineupSelect(false),
      );
    });

    it("applies dateFrom filter via gte", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({ dateFrom: "2025-06-01" });
      const builder = mock.builder(0);
      expect(builder.gte).toHaveBeenCalledWith("start_date", "2025-06-01");
    });

    it("applies state filter", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({ state: "OR" });
      const builder = mock.builder(0);
      expect(builder.select).toHaveBeenCalledWith(
        eventListWithLineupSelect(true),
      );
      expect(builder.eq).toHaveBeenCalledWith("cities.state_code", "OR");
    });

    it("applies genre filter via contains", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({ genre: "techno" });
      const builder = mock.builder(0);
      expect(builder.contains).toHaveBeenCalledWith("genre_ids", [
        "genre-uuid-techno",
      ]);
    });

    it("applies cityId filter when provided", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({ cityId: "city-1" });
      const builder = mock.builder(0);
      expect(builder.eq).toHaveBeenCalledWith("city_id", "city-1");
    });

    it("applies genreIds via overlaps when provided", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({ genreIds: ["g1", "g2"] });
      const builder = mock.builder(0);
      expect(builder.overlaps).toHaveBeenCalledWith("genre_ids", ["g1", "g2"]);
    });

    it("does not apply overlaps when genreIds empty or omitted", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({});
      await eventsService.getAll({ genreIds: [] });
      expect(
        (mock.builder(0).overlaps as jest.Mock).mock.calls.length,
      ).toBe(0);
      expect(
        (mock.builder(1).overlaps as jest.Mock).mock.calls.length,
      ).toBe(0);
    });

    it("composes cityId and genreIds in one query", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({
        cityId: "city-1",
        genreIds: ["g1"],
      });
      const builder = mock.builder(0);
      expect(builder.eq).toHaveBeenCalledWith("city_id", "city-1");
      expect(builder.overlaps).toHaveBeenCalledWith("genre_ids", ["g1"]);
    });

    it("does not apply city_id filter when cityId omitted", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll();
      const builder = mock.builder(0);
      expect(builder.eq).not.toHaveBeenCalledWith("city_id", expect.anything());
    });

    it("sorts by latest when specified", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getAll({ sort: "latest" });
      const builder = mock.builder(0);
      expect(builder.order).toHaveBeenCalledWith("start_date", { ascending: false });
    });
  });

  describe("getById", () => {
    it("returns an event with creator profile", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({ data: MOCK_EVENT, error: null });
        return b;
      }) as typeof origFrom;

      const result = await eventsService.getById("evt-1");
      expect(result).toEqual({ ...MOCK_EVENT, genres: ["techno"] });
    });

    it("returns null when not found", async () => {
      const result = await eventsService.getById("missing");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("inserts and returns the event", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({ data: MOCK_EVENT, error: null });
        return b;
      }) as typeof origFrom;

      const result = await eventsService.create({
        title: "Underground Session",
        start_date: "2025-06-15",
        created_by: "user-1",
        city_id: "city-portland",
      });
      expect(result).toEqual({ ...MOCK_EVENT, genres: ["techno"] });
    });
  });

  describe("cancel", () => {
    it("sets status to cancelled", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({
          data: { ...MOCK_EVENT, status: "cancelled" },
          error: null,
        });
        return b;
      }) as typeof origFrom;

      const result = await eventsService.cancel("evt-1");
      expect(result.status).toBe("cancelled");
      const builder = mock.builder(0);
      expect(builder.update).toHaveBeenCalledWith({ status: "cancelled" });
    });
  });

  describe("getEventsByDateRange", () => {
    const CALENDAR_SELECT =
      "*,cities:city_id(id,name,state_code,state_name,created_at)";

    it("builds overlap, visibility, sort, and published-only when logged out", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getEventsByDateRange("2026-04-01", "2026-04-30");

      const builder = mock.builder(0);
      expect(builder.select).toHaveBeenCalledWith(CALENDAR_SELECT);
      expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
      expect(builder.lte).toHaveBeenCalledWith("start_date", "2026-04-30");
      expect(builder.or).toHaveBeenNthCalledWith(
        1,
        "end_date.gte.2026-04-01,and(end_date.is.null,start_date.gte.2026-04-01)",
      );
      expect(builder.eq).toHaveBeenCalledWith("status", "published");
      expect(builder.order).toHaveBeenNthCalledWith(1, "start_date", {
        ascending: true,
      });
      expect(builder.order).toHaveBeenNthCalledWith(2, "start_time", {
        ascending: true,
        nullsFirst: false,
      });
    });

    it("applies cityId when provided", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getEventsByDateRange("2026-04-01", "2026-04-30", {
        cityId: "city-x",
      });

      const builder = mock.builder(0);
      expect(builder.eq).toHaveBeenCalledWith("city_id", "city-x");
    });

    it("does not filter by city when cityId omitted", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getEventsByDateRange("2026-04-01", "2026-04-30");
      const builder = mock.builder(0);
      const cityFilters = (builder.eq as jest.Mock).mock.calls.filter(
        (c: unknown[]) => c[0] === "city_id",
      );
      expect(cityFilters).toHaveLength(0);
    });

    it("applies genreIds via overlaps when provided", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getEventsByDateRange("2026-04-01", "2026-04-30", {
        genreIds: ["g1", "g2"],
      });

      const builder = mock.builder(0);
      expect(builder.overlaps).toHaveBeenCalledWith("genre_ids", ["g1", "g2"]);
    });

    it("composes cityId and genreIds", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getEventsByDateRange("2026-04-01", "2026-04-30", {
        cityId: "city-x",
        genreIds: ["g1"],
      });

      const builder = mock.builder(0);
      expect(builder.eq).toHaveBeenCalledWith("city_id", "city-x");
      expect(builder.overlaps).toHaveBeenCalledWith("genre_ids", ["g1"]);
    });

    it("uses or(published, created_by) when authenticated", async () => {
      mock = chainMock();
      mock.client.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: { id: "user-99" } },
        error: null,
      });
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await eventsService.getEventsByDateRange("2026-05-01", "2026-05-31");

      const builder = mock.builder(0);
      expect(builder.or).toHaveBeenNthCalledWith(
        2,
        "status.eq.published,created_by.eq.user-99",
      );
    });
  });

  describe("softDelete", () => {
    it("sets deleted_at", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        // softDelete doesn't use .single(), just resolves from the update chain
        (b.update as jest.Mock).mockReturnValue({
          ...b,
          eq: jest.fn().mockResolvedValue({ error: null }),
        });
        return b;
      }) as typeof origFrom;

      await expect(eventsService.softDelete("evt-1")).resolves.toBeUndefined();
    });
  });
});
