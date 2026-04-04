function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.upsert = jest.fn().mockReturnValue(chain);
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

jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    syncEventGroupParticipants: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    hydrateGenreLabels: jest.fn(async (rows: unknown[]) => rows),
  },
}));

import { eventLineupService } from "@/lib/services/event-lineup";
import { conversationsService } from "@/lib/services/conversations";

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
      expect(result).toEqual([{ ...MOCK_LINEUP_ITEM, profile: null }]);
      expect(mock.client.from).toHaveBeenCalledWith("event_lineup");
    });
  });

  describe("add", () => {
    it("upserts on event_id+profile_id and returns the lineup item", async () => {
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
      const b = mock.builder(0);
      expect(b.upsert).toHaveBeenCalledWith(
        {
          event_id: "evt-1",
          profile_id: "user-1",
          added_by: "user-2",
        },
        { onConflict: "event_id,profile_id" },
      );
      expect(conversationsService.syncEventGroupParticipants).toHaveBeenCalledWith(
        "evt-1",
      );
    });

    it("propagates other errors from upsert", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({
          data: null,
          error: { code: "42501", message: "permission denied" },
        });
        return b;
      }) as typeof origFrom;

      await expect(
        eventLineupService.add({
          event_id: "evt-1",
          profile_id: "user-1",
          added_by: "user-2",
        }),
      ).rejects.toEqual(
        expect.objectContaining({ code: "42501", message: "permission denied" }),
      );
    });
  });

  describe("updateRow", () => {
    it("updates sort_order and headliner fields", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.eq.mockResolvedValueOnce({ error: null });
        return b;
      }) as typeof origFrom;

      await eventLineupService.updateRow("lu-9", {
        sort_order: 2,
        is_headliner: true,
        set_time: "23:00",
      });

      const b = mock.builder(0);
      expect(b.update).toHaveBeenCalledWith({
        sort_order: 2,
        is_headliner: true,
        set_time: "23:00",
      });
      expect(b.eq).toHaveBeenCalledWith("id", "lu-9");
    });
  });

  describe("remove", () => {
    it("deletes by id and syncs group participants", async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { event_id: "evt-1" },
          error: null,
        }),
      };
      const deleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      let n = 0;
      mock = chainMock();
      mock.client.from = jest.fn(() => {
        n += 1;
        return n === 1 ? selectChain : deleteChain;
      });

      await expect(eventLineupService.remove("lu-1")).resolves.toBeUndefined();
      expect(conversationsService.syncEventGroupParticipants).toHaveBeenCalledWith(
        "evt-1",
      );
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
