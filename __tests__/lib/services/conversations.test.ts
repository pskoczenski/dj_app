const mockRpc = jest.fn();
const mockAuthGetUser = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: fromMock,
    rpc: mockRpc,
    auth: { getUser: mockAuthGetUser },
  }),
}));

import { conversationsService } from "@/lib/services/conversations";

describe("conversationsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("getOrCreateDM calls rpc with argument", async () => {
    mockRpc.mockResolvedValueOnce({ data: "conv-1", error: null });
    const id = await conversationsService.getOrCreateDM("user-2");
    expect(id).toBe("conv-1");
    expect(mockRpc).toHaveBeenCalledWith("get_or_create_dm", {
      other_user_id: "user-2",
    });
  });

  it("markAsRead updates conversation_participants row", async () => {
    const eq2 = jest.fn().mockResolvedValue({ error: null });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const update = jest.fn().mockReturnValue({ eq: eq1 });
    fromMock.mockReturnValueOnce({ update });

    await conversationsService.markAsRead("conv-9", "user-1");

    expect(fromMock).toHaveBeenCalledWith("conversation_participants");
    expect(update).toHaveBeenCalled();
    expect(eq1).toHaveBeenCalledWith("conversation_id", "conv-9");
    expect(eq2).toHaveBeenCalledWith("profile_id", "user-1");
  });
});
