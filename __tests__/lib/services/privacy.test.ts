function chainMock() {
  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.is = jest.fn().mockReturnValue(chain);
    chain.or = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
    chain.delete = jest.fn().mockReturnValue(chain);
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.then = jest.fn((resolve: unknown) =>
      Promise.resolve(
        typeof resolve === "function"
          ? (resolve as (v: unknown) => unknown)({ data: [], error: null })
          : undefined,
      ),
    );
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
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    },
    builder: (n: number) => builders[n],
    builders,
  };
}

let mock: ReturnType<typeof chainMock>;

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mock.client,
}));

import { privacyService } from "@/lib/services/privacy";
import { TABLES } from "@/lib/db/schema-constants";

describe("privacyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mock = chainMock();
  });

  describe("exportMyData", () => {
    it("reads profile + owned content tables", async () => {
      await privacyService.exportMyData();

      expect(mock.client.from).toHaveBeenCalledWith(TABLES.profiles);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.events);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.mixes);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.comments);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.messages);
    });
  });

  describe("deleteMyAccount", () => {
    it("soft-deletes owned content and hard-deletes relationship tables", async () => {
      await privacyService.deleteMyAccount();

      // Soft-deletes
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.profiles);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.events);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.mixes);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.messages);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.comments);

      // Hard-deletes
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.follows);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.commentLikes);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.mixLikes);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.eventLikes);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.eventSaves);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.conversationParticipants);
      expect(mock.client.from).toHaveBeenCalledWith(TABLES.eventLineup);

      expect(mock.client.auth.signOut).toHaveBeenCalled();
    });
  });
});

