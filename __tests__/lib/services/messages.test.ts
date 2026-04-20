const fromMock = jest.fn();
const mockAuthGetUser = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: fromMock,
    auth: { getUser: mockAuthGetUser },
  }),
}));

const mockMarkAsRead = jest.fn();
jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    markAsRead: (...a: unknown[]) => mockMarkAsRead(...a),
  },
}));

import { messagesService } from "@/lib/services/messages";

describe("messagesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMessages applies before cursor with lt", async () => {
    const limit = jest.fn().mockResolvedValue({ data: [], error: null });
    const lt = jest.fn().mockReturnValue({ limit });
    const order = jest.fn().mockReturnValue({ lt, limit });
    const is = jest.fn().mockReturnValue({ order });
    const eq = jest.fn().mockReturnValue({ is });
    const select = jest.fn().mockReturnValue({ eq });
    fromMock.mockReturnValueOnce({ select });

    await messagesService.getMessages("conv-1", {
      limit: 20,
      before: "2026-01-01T00:00:00.000Z",
    });

    expect(eq).toHaveBeenCalledWith("conversation_id", "conv-1");
    expect(lt).toHaveBeenCalledWith("created_at", "2026-01-01T00:00:00.000Z");
  });

  it("send inserts and then marks as read", async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: "m1", body: "hello" },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    fromMock.mockReturnValueOnce({ insert });

    await messagesService.send("conv-1", "hello", "user-1");

    expect(insert).toHaveBeenCalledWith({
      conversation_id: "conv-1",
      sender_id: "user-1",
      body: "hello",
    });
    expect(mockMarkAsRead).toHaveBeenCalledWith("conv-1", "user-1");
  });

  it("getMessageWithSender selects by id with sender embed", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: "m1",
        body: "x",
        sender: { id: "u1", display_name: "A", slug: "a", profile_image_url: null },
      },
      error: null,
    });
    const is = jest.fn().mockReturnValue({ maybeSingle });
    const eq = jest.fn().mockReturnValue({ is });
    const select = jest.fn().mockReturnValue({ eq });
    fromMock.mockReturnValueOnce({ select });

    const row = await messagesService.getMessageWithSender("m1");

    expect(eq).toHaveBeenCalledWith("id", "m1");
    expect(row?.id).toBe("m1");
  });
});
