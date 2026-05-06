function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.insert = jest.fn().mockResolvedValue({ error: null });
    chain.delete = jest.fn().mockReturnValue(chain);
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

import { blocksService } from "@/lib/services/blocks";
import { TABLES } from "@/lib/db/schema-constants";

describe("blocksService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  it("blocks user via insert", async () => {
    await blocksService.blockUser("user-2");
    expect(mock.client.from).toHaveBeenCalledWith(TABLES.blocks);
  });

  it("unblocks user via delete", async () => {
    await blocksService.unblockUser("user-2");
    expect(mock.client.from).toHaveBeenCalledWith(TABLES.blocks);
  });
});

