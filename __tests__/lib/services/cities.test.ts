const mockFrom = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import {
  citiesService,
  escapeIlikePattern,
  search,
} from "@/lib/services/cities";

function chainResolvingTo<T>(data: T, error: null | Error = null) {
  const methods = ["select", "order", "ilike", "limit", "eq"];
  const c: Record<string, jest.Mock> = {};
  for (const m of methods) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  (c as { then: typeof Promise.prototype.then }).then = (
    onFulfilled: (v: { data: T; error: typeof error }) => unknown,
  ) => Promise.resolve({ data, error }).then(onFulfilled);
  return c;
}

describe("citiesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listAll selects from cities with ordering", async () => {
    const c = chainResolvingTo([
      {
        id: "c1",
        name: "Portland",
        state_name: "Oregon",
        state_code: "OR",
        created_at: "2025-01-01",
      },
    ]);
    mockFrom.mockReturnValue(c);

    const rows = await citiesService.listAll();
    expect(mockFrom).toHaveBeenCalledWith("cities");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Portland");
    expect(c.order).toHaveBeenCalled();
  });

  it("getById fetches a single city by id", async () => {
    const row = {
      id: "c1",
      name: "Austin",
      state_name: "Texas",
      state_code: "TX",
      created_at: "2025-01-01",
    };
    const c: Record<string, jest.Mock> = {};
    c.select = jest.fn().mockReturnValue(c);
    c.eq = jest.fn().mockReturnValue(c);
    c.maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: row, error: null });
    mockFrom.mockReturnValue(c);

    const got = await citiesService.getById("c1");
    expect(mockFrom).toHaveBeenCalledWith("cities");
    expect(c.eq).toHaveBeenCalledWith("id", "c1");
    expect(got).toEqual(row);
  });

  it("search returns empty array for short query", async () => {
    await expect(search("a")).resolves.toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("search uses prefix ilike first and returns rows", async () => {
    const portlandMe = {
      id: "p1",
      name: "Portland",
      state_name: "Maine",
      state_code: "ME",
      created_at: "2025-01-01",
    };
    const c = chainResolvingTo([portlandMe]);
    mockFrom.mockReturnValue(c);

    const rows = await search("por");
    expect(rows).toEqual([portlandMe]);
    expect(c.ilike).toHaveBeenCalledWith("name", "por%");
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("search falls back to substring ilike when prefix empty", async () => {
    const denton = {
      id: "d1",
      name: "Denton",
      state_name: "Texas",
      state_code: "TX",
      created_at: "2025-01-01",
    };
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) return chainResolvingTo([]);
      return chainResolvingTo([denton]);
    });

    const rows = await search("nton");
    expect(rows).toEqual([denton]);
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("search orders substring matches with prefix-like names first", async () => {
    const sa = {
      id: "a",
      name: "San Antonio",
      state_name: "Texas",
      state_code: "TX",
      created_at: "1",
    };
    const sb = {
      id: "b",
      name: "Easton",
      state_name: "Pennsylvania",
      state_code: "PA",
      created_at: "1",
    };
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) return chainResolvingTo([]);
      return chainResolvingTo([sb, sa]);
    });

    const rows = await search("ton");
    expect(rows.map((r) => r.name)).toEqual(["Easton", "San Antonio"]);
  });

  it("escapeIlikePattern escapes wildcard characters", () => {
    expect(escapeIlikePattern("100%")).toBe("100\\%");
    expect(escapeIlikePattern("a_b")).toBe("a\\_b");
  });
});
