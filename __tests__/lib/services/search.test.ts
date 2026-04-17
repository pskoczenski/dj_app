function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.in = jest.fn().mockReturnValue(chain);
    chain.overlaps = jest.fn().mockReturnValue(chain);
    chain.or = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
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
    },
    builder: (n: number) => builders[n],
  };
}

let mock: ReturnType<typeof chainMock>;

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mock.client,
}));

jest.mock("@/lib/services/events", () => ({
  EVENT_LIST_WITH_LINEUP: "*",
}));

jest.mock("@/lib/services/mixes", () => ({
  MIX_LIST_SELECT: "*",
}));

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    hydrateGenreLabels: jest.fn(async (rows: unknown[]) => rows),
  },
}));

import { searchDjs } from "@/lib/services/search";

describe("searchDjs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  it("returns empty array when query is shorter than 2 chars and no genre filter", async () => {
    const result = await searchDjs("a");
    expect(result).toEqual([]);
    expect(mock.client.from).not.toHaveBeenCalled();
  });

  it("queries profiles table with ilike filter", async () => {
    await searchDjs("berlin");
    const b = mock.builder(0);
    expect(mock.client.from).toHaveBeenCalledWith("profiles");
    expect(b.or).toHaveBeenCalledWith(
      expect.stringContaining("%berlin%"),
    );
  });

  it("applies city filter when cityId provided", async () => {
    await searchDjs("berlin", { cityId: "city-123" });
    const b = mock.builder(0);
    expect(b.eq).toHaveBeenCalledWith("city_id", "city-123");
  });

  it("applies genre overlap filter when genreIds provided", async () => {
    await searchDjs("berlin", { genreIds: ["genre-1", "genre-2"] });
    const b = mock.builder(0);
    expect(b.overlaps).toHaveBeenCalledWith("genre_ids", ["genre-1", "genre-2"]);
  });

  it("applies profile_type IN filter when profileTypes provided", async () => {
    await searchDjs("berlin", { profileTypes: ["venue", "promoter"] });
    const b = mock.builder(0);
    expect(b.in).toHaveBeenCalledWith("profile_type", ["venue", "promoter"]);
  });

  it("does not apply profile_type filter when profileTypes is empty", async () => {
    await searchDjs("berlin", { profileTypes: [] });
    const b = mock.builder(0);
    expect(b.in).not.toHaveBeenCalled();
  });
});
