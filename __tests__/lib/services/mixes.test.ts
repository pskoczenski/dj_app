function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.contains = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.range = jest.fn().mockReturnValue(chain);
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
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

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    hydrateGenreLabels: jest.fn(async (rows: Record<string, unknown>[]) =>
      rows.map((r) => ({ ...r, genres: [] as string[] })),
    ),
    ensureGenreIdsExist: jest.fn().mockResolvedValue(undefined),
    resolveFilterTokenToId: jest.fn(),
    resolveLabelsToIds: jest.fn(),
    getIdToNameMap: jest.fn(),
    labelToSlug: jest.fn(),
  },
}));

import { genresService } from "@/lib/services/genres";
import { mixesService } from "@/lib/services/mixes";

describe("mixesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  describe("getAll", () => {
    it("queries mixes with default sort (newest)", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as any).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await mixesService.getAll();
      expect(mock.client.from).toHaveBeenCalledWith("mixes");
      const builder = mock.builder(0);
      expect(builder.select).toHaveBeenCalledWith(
        expect.stringMatching(/creator:profiles!mixes_profile_id_fkey/),
      );
      expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("applies genre filter via genre_ids", async () => {
      jest.mocked(genresService.resolveFilterTokenToId).mockResolvedValueOnce(
        "11111111-1111-4111-8111-111111111111",
      );
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        (b as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }) as typeof origFrom;

      await mixesService.getAll({ genre: "house" });
      const builder = mock.builder(0);
      expect(genresService.resolveFilterTokenToId).toHaveBeenCalledWith("house");
      expect(builder.contains).toHaveBeenCalledWith("genre_ids", [
        "11111111-1111-4111-8111-111111111111",
      ]);
    });
  });

  describe("create", () => {
    it("inserts and returns the mix", async () => {
      const mixData = {
        id: "mix-1",
        title: "Summer Vibes",
        embed_url: "https://soundcloud.com/x/y",
        platform: "soundcloud" as const,
      };
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({ data: mixData, error: null });
        return b;
      }) as typeof origFrom;

      const result = await mixesService.create({
        title: "Summer Vibes",
        embed_url: "https://soundcloud.com/x/y",
        platform: "soundcloud",
        profile_id: "user-1",
      });
      expect(result).toEqual({ ...mixData, genres: [] });
    });

    it("validates genre_ids before insert when provided", async () => {
      const mixData = {
        id: "mix-1",
        title: "Summer Vibes",
        embed_url: "https://soundcloud.com/x/y",
        platform: "soundcloud" as const,
        profile_id: "user-1",
        genre_ids: ["g1"],
      };
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.single.mockResolvedValueOnce({ data: mixData, error: null });
        return b;
      }) as typeof origFrom;

      await mixesService.create({
        title: "Summer Vibes",
        embed_url: "https://soundcloud.com/x/y",
        platform: "soundcloud",
        profile_id: "user-1",
        genre_ids: ["g1"],
      });
      expect(jest.mocked(genresService.ensureGenreIdsExist)).toHaveBeenCalledWith([
        "g1",
      ]);
    });
  });

  describe("reorder", () => {
    it("updates sort_order for each mix id", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.eq.mockReturnValue({ ...b, eq: jest.fn().mockResolvedValue({ error: null }) });
        return b;
      }) as typeof origFrom;

      await mixesService.reorder("user-1", ["mix-2", "mix-1", "mix-3"]);

      expect(mock.client.from).toHaveBeenCalledTimes(3);
    });
  });

  describe("softDelete", () => {
    it("sets deleted_at", async () => {
      mock = chainMock();
      const origFrom = mock.client.from;
      mock.client.from = jest.fn((...args) => {
        const b = origFrom(...args);
        b.eq.mockResolvedValueOnce({ error: null });
        return b;
      }) as typeof origFrom;

      await expect(mixesService.softDelete("mix-1")).resolves.toBeUndefined();
    });
  });
});
