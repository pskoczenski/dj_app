function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
    chain.delete = jest.fn().mockReturnValue(chain);
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

import { eventLineupService } from "@/lib/services/event-lineup";

const MOCK_LINEUP_ITEM = {
  id: "lu-1",
  event_id: "evt-1",
  profile_id: "user-1",
  added_by: "user-2",
  sort_order: 0,
  set_time: null,
  is_headliner: false,
  created_at: "2025-01-01",
};

describe("eventLineupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  describe("listForEvent", () => {
    it("returns lineup items ordered by sort_order", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [MOCK_LINEUP_ITEM], error: null });
        return b;
      }) as typeof origFrom;

      const result = await eventLineupService.listForEvent("evt-1");
      expect(result).toEqual([MOCK_LINEUP_ITEM]);
      expect(mock.client.from).toHaveBeenCalledWith("event_lineup");
    });
  });

  describe("add", () => {
    it("inserts and returns the lineup item", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({ data: MOCK_LINEUP_ITEM, error: null });
        return b;
      }) as typeof origFrom;

      const result = await eventLineupService.add({
        event_id: "evt-1",
        profile_id: "user-1",
        added_by: "user-2",
      });
      expect(result).toEqual(MOCK_LINEUP_ITEM);
    });

    it("throws a friendly error on unique violation", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({
          data: null,
          error: { code: "23505", message: "duplicate key" },
        });
        return b;
      }) as typeof origFrom;

      await expect(
        eventLineupService.add({
          event_id: "evt-1",
          profile_id: "user-1",
          added_by: "user-2",
        }),
      ).rejects.toThrow("This DJ is already in the lineup.");
    });
  });

  describe("remove", () => {
    it("deletes by id", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.eq.mockResolvedValueOnce({ error: null });
        return b;
      }) as typeof origFrom;

      await expect(eventLineupService.remove("lu-1")).resolves.toBeUndefined();
    });
  });

  describe("reorder", () => {
    it("updates sort_order for each item", async () => {
      // Each reorder call invokes from() once per item
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.eq.mockResolvedValueOnce({ error: null });
        return b;
      }) as typeof origFrom;

      await eventLineupService.reorder([
        { id: "lu-1", sort_order: 1 },
        { id: "lu-2", sort_order: 0 },
      ]);

      expect(mock.client.from).toHaveBeenCalledTimes(2);
    });
  });
});
