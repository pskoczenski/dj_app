import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetComments = jest.fn();
const mockCreateComment = jest.fn();
const mockSoftDelete = jest.fn();
const mockUpdateComment = jest.fn();
const mockGetCommentWithAuthor = jest.fn();
const mockGetCommentCount = jest.fn();
const mockToastError = jest.fn();

jest.mock("@/lib/services/comments", () => ({
  DEFAULT_COMMENTS_PAGE_SIZE: 20,
  commentsService: {
    getComments: (...a: unknown[]) => mockGetComments(...a),
    create: (...a: unknown[]) => mockCreateComment(...a),
    softDelete: (...a: unknown[]) => mockSoftDelete(...a),
    update: (...a: unknown[]) => mockUpdateComment(...a),
    getCommentWithAuthor: (...a: unknown[]) => mockGetCommentWithAuthor(...a),
    getCommentCount: (...a: unknown[]) => mockGetCommentCount(...a),
  },
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: { id: "user-1", email: "a@example.com" },
    loading: false,
  }),
}));

let capturedInsertCb: ((payload: { new: Record<string, unknown> }) => void) | null =
  null;
let capturedUpdateCb: ((payload: { new: Record<string, unknown> }) => void) | null =
  null;
const mockRemoveChannel = jest.fn();
const mockSubscribe = jest.fn(() => mockChannelObj);
const mockChannelObj = {
  on: jest.fn(
    (
      type: string,
      config: { event?: string } | unknown,
      cb: (payload: { new: Record<string, unknown> }) => void,
    ) => {
      if (type === "postgres_changes" && config && typeof config === "object") {
        const ev = (config as { event?: string }).event;
        if (ev === "INSERT") capturedInsertCb = cb;
        if (ev === "UPDATE") capturedUpdateCb = cb;
      }
      return mockChannelObj;
    },
  ),
  subscribe: mockSubscribe,
};
const mockSupabaseClient = {
  channel: jest.fn(() => mockChannelObj),
  removeChannel: mockRemoveChannel,
};
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => mockToastError(...a),
  },
}));

import { useComments } from "@/hooks/use-comments";

describe("useComments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedInsertCb = null;
    capturedUpdateCb = null;
    mockChannelObj.on.mockImplementation(
      (
        type: string,
        config: { event?: string } | unknown,
        cb: (payload: { new: Record<string, unknown> }) => void,
      ) => {
        if (type === "postgres_changes" && config && typeof config === "object") {
          const ev = (config as { event?: string }).event;
          if (ev === "INSERT") capturedInsertCb = cb;
          if (ev === "UPDATE") capturedUpdateCb = cb;
        }
        return mockChannelObj;
      },
    );
  });

  it("addComment prepends new comment", async () => {
    mockGetComments.mockResolvedValueOnce({ comments: [], totalCount: 0 });
    mockCreateComment.mockResolvedValueOnce({
      id: "c1",
      body: "hello",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      profile_id: "u1",
      author: null,
      likeCount: 0,
      likedByMe: false,
    });
    const { result } = renderHook(() => useComments("mix", "mix-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addComment("hello");
    });

    expect(result.current.comments[0]?.id).toBe("c1");
    expect(result.current.totalCount).toBe(1);
  });

  it("deleteComment removes comment from list", async () => {
    mockGetComments.mockResolvedValueOnce({
      comments: [
        {
          id: "c1",
          body: "hello",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          profile_id: "u1",
          author: null,
          likeCount: 0,
          likedByMe: false,
        },
      ],
      totalCount: 1,
    });
    mockSoftDelete.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useComments("mix", "mix-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteComment("c1");
    });

    expect(result.current.comments).toHaveLength(0);
    expect(result.current.totalCount).toBe(0);
  });

  it("updateComment replaces body from server response", async () => {
    mockGetComments.mockResolvedValueOnce({
      comments: [
        {
          id: "c1",
          body: "old",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          profile_id: "u1",
          author: null,
          likeCount: 3,
          likedByMe: true,
        },
      ],
      totalCount: 1,
    });
    mockUpdateComment.mockResolvedValueOnce({
      id: "c1",
      body: "new",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
      profile_id: "u1",
      author: { display_name: "A", slug: "a", profile_image_url: null },
    });
    const { result } = renderHook(() => useComments("mix", "mix-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateComment("c1", "new");
    });

    expect(mockUpdateComment).toHaveBeenCalledWith("c1", "new");
    expect(result.current.comments[0]?.body).toBe("new");
    expect(result.current.comments[0]?.updated_at).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(result.current.comments[0]?.likeCount).toBe(3);
    expect(result.current.comments[0]?.likedByMe).toBe(true);
  });

  it("loadMore appends older comments", async () => {
    mockGetComments
      .mockResolvedValueOnce({
        comments: [
          {
            id: "c1",
            body: "new",
            created_at: null,
            updated_at: null,
            profile_id: "u1",
            author: null,
            likeCount: 0,
            likedByMe: false,
          },
        ],
        totalCount: 2,
      })
      .mockResolvedValueOnce({
        comments: [
          {
            id: "c2",
            body: "old",
            created_at: null,
            updated_at: null,
            profile_id: "u2",
            author: null,
            likeCount: 0,
            likedByMe: false,
          },
        ],
        totalCount: 2,
      });

    const { result } = renderHook(() => useComments("mix", "mix-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.comments.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("hasMore is true when totalCount exceeds loaded comments", async () => {
    mockGetComments.mockResolvedValueOnce({
      comments: [
        {
          id: "c1",
          body: "only page one",
          created_at: null,
          updated_at: null,
          profile_id: "u1",
          author: null,
          likeCount: 0,
          likedByMe: false,
        },
      ],
      totalCount: 10,
    });
    const { result } = renderHook(() => useComments("mix", "mix-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it("hasMore is false when all comments are loaded", async () => {
    mockGetComments.mockResolvedValueOnce({
      comments: [
        {
          id: "c1",
          body: "a",
          created_at: null,
          updated_at: null,
          profile_id: "u1",
          author: null,
          likeCount: 0,
          likedByMe: false,
        },
      ],
      totalCount: 1,
    });
    const { result } = renderHook(() => useComments("mix", "mix-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it("subscribes to comments realtime when subscribeRealtime is true", async () => {
    mockGetComments.mockResolvedValueOnce({ comments: [], totalCount: 0 });
    renderHook(() =>
      useComments("mix", "mix-uuid-1", { subscribeRealtime: true }),
    );
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      "comments:mix:mix-uuid-1",
    );
  });

  it("merges hydrated comment on realtime insert from another profile", async () => {
    mockGetComments.mockResolvedValue({ comments: [], totalCount: 0 });
    const hydrated = {
      id: "c-new",
      body: "hey",
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
      profile_id: "other",
      author: { display_name: "O", slug: "o", profile_image_url: null },
      likeCount: 0,
      likedByMe: false,
    };
    mockGetCommentWithAuthor.mockResolvedValue(hydrated);
    mockGetCommentCount.mockResolvedValue(1);

    const { result } = renderHook(() =>
      useComments("mix", "mix-uuid-1", { subscribeRealtime: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(capturedInsertCb).not.toBeNull());

    await act(async () => {
      capturedInsertCb?.({
        new: {
          id: "c-new",
          commentable_type: "mix",
          commentable_id: "mix-uuid-1",
          profile_id: "other-user",
        },
      });
    });

    await waitFor(() => expect(mockGetCommentWithAuthor).toHaveBeenCalledWith("c-new"));
    await waitFor(() => expect(result.current.comments[0]?.id).toBe("c-new"));
    expect(mockGetCommentCount).toHaveBeenCalledWith("mix", "mix-uuid-1");
    expect(result.current.totalCount).toBe(1);
  });

  it("ignores realtime insert from current user profile", async () => {
    mockGetComments.mockResolvedValue({ comments: [], totalCount: 0 });

    renderHook(() =>
      useComments("event", "evt-1", { subscribeRealtime: true }),
    );
    await waitFor(() => expect(capturedInsertCb).not.toBeNull());

    await act(async () => {
      capturedInsertCb?.({
        new: {
          id: "c-self",
          commentable_type: "event",
          commentable_id: "evt-1",
          profile_id: "user-1",
        },
      });
    });

    await new Promise((r) => setTimeout(r, 15));
    expect(mockGetCommentWithAuthor).not.toHaveBeenCalled();
  });

  it("realtime UPDATE with deleted_at removes comment and decrements count", async () => {
    mockGetComments.mockResolvedValueOnce({
      comments: [
        {
          id: "c1",
          body: "x",
          created_at: null,
          updated_at: null,
          profile_id: "u2",
          author: null,
          likeCount: 0,
          likedByMe: false,
        },
      ],
      totalCount: 1,
    });

    const { result } = renderHook(() =>
      useComments("mix", "mix-uuid-1", { subscribeRealtime: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(capturedUpdateCb).not.toBeNull());

    await act(async () => {
      capturedUpdateCb?.({
        new: {
          id: "c1",
          commentable_type: "mix",
          commentable_id: "mix-uuid-1",
          deleted_at: "2026-01-03T00:00:00.000Z",
        },
      });
    });

    await waitFor(() => expect(result.current.comments).toHaveLength(0));
    expect(result.current.totalCount).toBe(0);
  });

  it("realtime UPDATE merges body without refetch when not deleted", async () => {
    mockGetComments.mockResolvedValueOnce({
      comments: [
        {
          id: "c1",
          body: "old",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          profile_id: "other",
          author: null,
          likeCount: 2,
          likedByMe: false,
        },
      ],
      totalCount: 1,
    });

    const { result } = renderHook(() =>
      useComments("mix", "mix-uuid-1", { subscribeRealtime: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      capturedUpdateCb?.({
        new: {
          id: "c1",
          commentable_type: "mix",
          commentable_id: "mix-uuid-1",
          deleted_at: null,
          body: "patched",
          updated_at: "2026-01-04T00:00:00.000Z",
        },
      });
    });

    expect(result.current.comments[0]?.body).toBe("patched");
    expect(result.current.comments[0]?.likeCount).toBe(2);
  });

  it("removes realtime channel on unmount when subscribed", async () => {
    mockGetComments.mockResolvedValueOnce({ comments: [], totalCount: 0 });
    const { unmount } = renderHook(() =>
      useComments("mix", "mix-u", { subscribeRealtime: true }),
    );
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannelObj);
  });
});

