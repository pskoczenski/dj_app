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
    },
    builder: (n: number) => builders[n],
    builders,
  };
}

let mock: ReturnType<typeof chainMock>;

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mock.client,
}));

import { eventsService } from "@/lib/services/events";

const MOCK_EVENT = {
  id: "evt-1",
  title: "Underground Session",
  created_by: "user-1",
  start_date: "2025-06-15",
  status: "published",
  deleted_at: null,
  city: "Portland",
  state: "OR",
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
  ticket_url: null,
  venue: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
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
      expect(result).toEqual([MOCK_EVENT]);
      expect(mock.client.from).toHaveBeenCalledWith("events");
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
      // eq is called twice: once for status, once for state
      expect(builder.eq).toHaveBeenCalledWith("state", "OR");
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
      expect(builder.contains).toHaveBeenCalledWith("genres", ["techno"]);
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
      expect(result).toEqual(MOCK_EVENT);
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
      });
      expect(result).toEqual(MOCK_EVENT);
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
