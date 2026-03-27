const fromMock = jest.fn();
const authGetUserMock = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: fromMock,
    auth: { getUser: authGetUserMock },
  }),
}));

import { commentLikesService } from "@/lib/services/comment-likes";

describe("commentLikesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("toggleLike inserts when no existing like", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq2 = jest.fn().mockReturnValue({ maybeSingle });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const selectExisting = jest.fn().mockReturnValue({ eq: eq1 });

    const insert = jest.fn().mockResolvedValue({ error: null });

    const eqCount = jest.fn().mockResolvedValue({ count: 1, error: null });
    const selectCount = jest.fn().mockReturnValue({ eq: eqCount });

    fromMock
      .mockReturnValueOnce({ select: selectExisting })
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ select: selectCount });

    const result = await commentLikesService.toggleLike("c1");
    expect(insert).toHaveBeenCalledWith({ comment_id: "c1", profile_id: "user-1" });
    expect(result).toEqual({ liked: true, likeCount: 1 });
  });

  it("toggleLike deletes when like exists", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: "like-1" },
      error: null,
    });
    const eq2 = jest.fn().mockReturnValue({ maybeSingle });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const selectExisting = jest.fn().mockReturnValue({ eq: eq1 });

    const eqDelete = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq: eqDelete });

    const eqCount = jest.fn().mockResolvedValue({ count: 0, error: null });
    const selectCount = jest.fn().mockReturnValue({ eq: eqCount });

    fromMock
      .mockReturnValueOnce({ select: selectExisting })
      .mockReturnValueOnce({ delete: del })
      .mockReturnValueOnce({ select: selectCount });

    const result = await commentLikesService.toggleLike("c1");
    expect(eqDelete).toHaveBeenCalledWith("id", "like-1");
    expect(result).toEqual({ liked: false, likeCount: 0 });
  });

  it("getLikedCommentIds returns subset", async () => {
    const inFn = jest.fn().mockResolvedValue({
      data: [{ comment_id: "c1" }],
      error: null,
    });
    const eqFn = jest.fn().mockReturnValue({ in: inFn });
    const select = jest.fn().mockReturnValue({ eq: eqFn });
    fromMock.mockReturnValueOnce({ select });

    const ids = await commentLikesService.getLikedCommentIds(["c1", "c2"]);
    expect(ids).toEqual(["c1"]);
  });
});

