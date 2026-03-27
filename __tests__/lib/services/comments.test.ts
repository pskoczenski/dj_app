const fromMock = jest.fn();
const authGetUserMock = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: fromMock,
    auth: { getUser: authGetUserMock },
  }),
}));

import { commentsService } from "@/lib/services/comments";

describe("commentsService", () => {
  beforeEach(() => {
    fromMock.mockReset();
    authGetUserMock.mockReset();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("getComments filters by type/id, active rows, ordering, and pagination", async () => {
    const range = jest.fn().mockResolvedValue({
      data: [
        {
          id: "c1",
          body: "hello",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          profile_id: "user-2",
          author: {
            id: "user-2",
            display_name: "DJ Beta",
            slug: "dj-beta",
            profile_image_url: null,
          },
        },
      ],
      error: null,
      count: 1,
    });
    const order = jest.fn().mockReturnValue({ range });
    const is = jest.fn().mockReturnValue({ order });
    const eq2 = jest.fn().mockReturnValue({ is });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const selectComments = jest.fn().mockReturnValue({ eq: eq1 });

    const inLikes = jest.fn().mockResolvedValue({
      data: [{ comment_id: "c1" }, { comment_id: "c1" }],
      error: null,
    });
    const selectLikes = jest.fn().mockReturnValue({ in: inLikes });

    const inLikedByMe = jest.fn().mockResolvedValue({
      data: [{ comment_id: "c1" }],
      error: null,
    });
    const eqLikedByMe = jest.fn().mockReturnValue({ in: inLikedByMe });
    const selectLikedByMe = jest.fn().mockReturnValue({ eq: eqLikedByMe });

    fromMock
      .mockReturnValueOnce({ select: selectComments })
      .mockReturnValueOnce({ select: selectLikes })
      .mockReturnValueOnce({ select: selectLikedByMe });

    const result = await commentsService.getComments("mix", "mix-1", {
      limit: 20,
      offset: 0,
    });

    expect(eq1).toHaveBeenCalledWith("commentable_type", "mix");
    expect(eq2).toHaveBeenCalledWith("commentable_id", "mix-1");
    expect(is).toHaveBeenCalledWith("deleted_at", null);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(range).toHaveBeenCalledWith(0, 19);
    expect(result.totalCount).toBe(1);
    expect(result.comments[0]?.likeCount).toBe(2);
    expect(result.comments[0]?.likedByMe).toBe(true);
  });

  it("create inserts with auth user and returns created comment", async () => {
    const singleInsert = jest.fn().mockResolvedValue({
      data: {
        id: "c1",
        body: "hello",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        profile_id: "user-1",
      },
      error: null,
    });
    const selectInsert = jest.fn().mockReturnValue({ single: singleInsert });
    const insert = jest.fn().mockReturnValue({ select: selectInsert });

    const singleProfile = jest.fn().mockResolvedValue({
      data: {
        display_name: "DJ Alpha",
        slug: "dj-alpha",
        profile_image_url: null,
      },
      error: null,
    });
    const eqProfile = jest.fn().mockReturnValue({ single: singleProfile });
    const selectProfile = jest.fn().mockReturnValue({ eq: eqProfile });

    fromMock
      .mockReturnValueOnce({ insert })
      .mockReturnValueOnce({ select: selectProfile });

    const result = await commentsService.create("event", "evt-1", "  hello ");
    expect(insert).toHaveBeenCalledWith({
      commentable_type: "event",
      commentable_id: "evt-1",
      profile_id: "user-1",
      body: "hello",
    });
    expect(result.id).toBe("c1");
    expect(result.author?.display_name).toBe("DJ Alpha");
  });

  it("softDelete updates deleted_at on row", async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    fromMock.mockReturnValueOnce({ update });

    const ok = await commentsService.softDelete("c1");
    expect(update).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "c1");
    expect(ok).toBe(true);
  });

  it("getCommentCount returns exact count", async () => {
    const is = jest.fn().mockResolvedValue({ count: 4, error: null });
    const eq2 = jest.fn().mockReturnValue({ is });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const select = jest.fn().mockReturnValue({ eq: eq1 });
    fromMock.mockReturnValueOnce({ select });

    const count = await commentsService.getCommentCount("mix", "mix-1");
    expect(count).toBe(4);
  });
});

