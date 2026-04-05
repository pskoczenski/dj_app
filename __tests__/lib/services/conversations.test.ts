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

  describe("syncEventGroupParticipants", () => {
    it("calls sync_event_group_participants_for_event RPC", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await conversationsService.syncEventGroupParticipants("evt-1");

      expect(mockRpc).toHaveBeenCalledWith(
        "sync_event_group_participants_for_event",
        { p_event_id: "evt-1" },
      );
      expect(fromMock).not.toHaveBeenCalled();
    });
  });

  describe("ensureEventGroupThread", () => {
    it("returns null for draft events without querying conversations", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      const maybeSingle = jest.fn().mockResolvedValue({
        data: { id: "evt-1", status: "draft", created_by: "user-1" },
        error: null,
      });
      const eq = jest.fn().mockReturnValue({ maybeSingle });
      const select = jest.fn().mockReturnValue({ eq });
      fromMock.mockReturnValueOnce({ select });

      const id = await conversationsService.ensureEventGroupThread("evt-1");
      expect(id).toBeNull();
      expect(fromMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledWith("events");
    });
  });

  it("createEventGroupThread throws when chat cannot be created", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: "evt-1", status: "draft", created_by: "user-1" },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    fromMock.mockReturnValueOnce({ select });

    await expect(
      conversationsService.createEventGroupThread("evt-1", "user-1"),
    ).rejects.toThrow(/not available/i);
  });
});
