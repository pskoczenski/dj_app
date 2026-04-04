const mockFrom = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import { genresService } from "@/lib/services/genres";

function chainResolvingTo<T>(data: T, error: null | Error = null) {
  const methods = ["select", "order", "ilike", "limit", "in", "not"];
  const c: Record<string, jest.Mock> = {};
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  (c as { then: typeof Promise.prototype.then }).then = (
    onFulfilled: (v: { data: T; error: typeof error }) => unknown,
  ) => Promise.resolve({ data, error }).then(onFulfilled);
  return c;
}

describe("genresService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAll fetches all genres ordered by name", async () => {
    const c = chainResolvingTo([
      { id: "g1", slug: "house", name: "House" },
      { id: "g2", slug: "techno", name: "Techno" },
    ]);
    mockFrom.mockReturnValue(c);

    const rows = await genresService.getAll();
    expect(mockFrom).toHaveBeenCalledWith("genres");
    expect(c.order).toHaveBeenCalledWith("name", { ascending: true });
    expect(rows).toHaveLength(2);
  });

  it("search uses prefix ILIKE first", async () => {
    let call = 0;
    const prefix = chainResolvingTo([{ id: "g1", slug: "house", name: "House" }]);
    const fallback = chainResolvingTo([]);
    mockFrom.mockImplementation(() => {
      call += 1;
      return call === 1 ? prefix : fallback;
    });

    const rows = await genresService.search("ho");
    expect(rows).toHaveLength(1);
    expect(prefix.ilike).toHaveBeenCalledWith("name", "ho%");
  });

  it("search passes excludeIds using not(in)", async () => {
    const c = chainResolvingTo([]);
    mockFrom.mockReturnValue(c);

    await genresService.search("ho", { excludeIds: ["uuid-1", "uuid-2"] });
    expect(c.not).toHaveBeenCalledWith("id", "in", "(uuid-1,uuid-2)");
  });

  it("search falls back to substring ILIKE when prefix results are under limit", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) return chainResolvingTo([]);
      return chainResolvingTo([{ id: "g9", slug: "deep-house", name: "Deep House" }]);
    });

    const rows = await genresService.search("house", { limit: 15 });
    expect(rows.map((r) => r.name)).toEqual(["Deep House"]);
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("getByIds fetches by id array and returns in input order", async () => {
    const c = chainResolvingTo([
      { id: "b", slug: "techno", name: "Techno" },
      { id: "a", slug: "house", name: "House" },
    ]);
    mockFrom.mockReturnValue(c);

    const rows = await genresService.getByIds(["a", "b"]);
    expect(c.in).toHaveBeenCalledWith("id", ["a", "b"]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("ensureGenreIdsExist no-ops for empty input", async () => {
    await expect(genresService.ensureGenreIdsExist([])).resolves.toBeUndefined();
    await expect(genresService.ensureGenreIdsExist(undefined)).resolves.toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("ensureGenreIdsExist resolves when all ids exist", async () => {
    const c = chainResolvingTo([{ id: "g1" }, { id: "g2" }]);
    mockFrom.mockReturnValue(c);

    await genresService.ensureGenreIdsExist(["g1", "g2"]);
    expect(mockFrom).toHaveBeenCalledWith("genres");
    expect(c.in).toHaveBeenCalledWith("id", ["g1", "g2"]);
  });

  it("ensureGenreIdsExist throws when any id is missing", async () => {
    const c = chainResolvingTo([{ id: "g1" }]);
    mockFrom.mockReturnValue(c);

    await expect(
      genresService.ensureGenreIdsExist(["g1", "ghost"]),
    ).rejects.toThrow(/Unknown genre id/);
  });
});

