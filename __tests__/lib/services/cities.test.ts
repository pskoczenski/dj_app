function chainMock() {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  return chain;
}

const mockFrom = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import { citiesService } from "@/lib/services/cities";

describe("citiesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const c = chainMock();
    mockFrom.mockReturnValue(c);
    (c as { then?: unknown }).then = (resolve: (v: unknown) => void) =>
      resolve({
        data: [
          {
            id: "c1",
            name: "Portland",
            state_name: "Oregon",
            state_code: "OR",
            created_at: "2025-01-01",
          },
        ],
        error: null,
      });
  });

  it("listAll selects from cities with ordering", async () => {
    const rows = await citiesService.listAll();
    expect(mockFrom).toHaveBeenCalledWith("cities");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Portland");
  });
});
