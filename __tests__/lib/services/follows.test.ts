function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.range = jest.fn().mockReturnValue(chain);
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.delete = jest.fn().mockReturnValue(chain);
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
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

import { followsService } from "@/lib/services/follows";

describe("followsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  describe("follow", () => {
    it("inserts a follow row", async () => {
      const followRow = { id: "f-1", follower_id: "a", following_id: "b", created_at: null };
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({ data: followRow, error: null });
        return b;
      }) as typeof origFrom;

      const result = await followsService.follow("a", "b");
      expect(result).toEqual(followRow);
      expect(mock.client.from).toHaveBeenCalledWith("follows");
    });

    it("throws when trying to follow self", async () => {
      await expect(followsService.follow("a", "a")).rejects.toThrow(
        "You cannot follow yourself.",
      );
    });

    it("throws a friendly error on duplicate", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({
          data: null,
          error: { code: "23505", message: "duplicate" },
        });
        return b;
      }) as typeof origFrom;

      await expect(followsService.follow("a", "b")).rejects.toThrow(
        "Already following this user.",
      );
    });
  });

  describe("unfollow", () => {
    it("deletes the follow row", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.eq.mockReturnValue({
          ...b,
          eq: jest.fn().mockResolvedValue({ error: null }),
        });
        return b;
      }) as typeof origFrom;

      await expect(followsService.unfollow("a", "b")).resolves.toBeUndefined();
    });
  });

  describe("isFollowing", () => {
    it("returns true when a row exists", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.maybeSingle.mockResolvedValueOnce({ data: { id: "f-1" }, error: null });
        return b;
      }) as typeof origFrom;

      const result = await followsService.isFollowing("a", "b");
      expect(result).toBe(true);
    });

    it("returns false when no row exists", async () => {
      const result = await followsService.isFollowing("a", "b");
      expect(result).toBe(false);
    });
  });
});
