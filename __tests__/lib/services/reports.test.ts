function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.insert = jest.fn().mockResolvedValue({ error: null });
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
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    },
    builders,
  };
}

let mock: ReturnType<typeof chainMock>;

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mock.client,
}));

import { reportsService } from "@/lib/services/reports";
import { TABLES } from "@/lib/db/schema-constants";

describe("reportsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  it("inserts a report row", async () => {
    await reportsService.createReport({
      subjectType: "profile",
      subjectId: "00000000-0000-0000-0000-000000000000",
      reason: "spam",
      note: "test",
    });
    expect(mock.client.from).toHaveBeenCalledWith(TABLES.reports);
  });
});

