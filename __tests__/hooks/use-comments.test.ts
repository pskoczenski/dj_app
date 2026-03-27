import { act, renderHook, waitFor } from "@testing-library/react";

const mockGetComments = jest.fn();
const mockCreateComment = jest.fn();
const mockSoftDelete = jest.fn();
const mockToastError = jest.fn();

jest.mock("@/lib/services/comments", () => ({
  DEFAULT_COMMENTS_PAGE_SIZE: 20,
  commentsService: {
    getComments: (...a: unknown[]) => mockGetComments(...a),
    create: (...a: unknown[]) => mockCreateComment(...a),
    softDelete: (...a: unknown[]) => mockSoftDelete(...a),
    getCommentCount: jest.fn(),
  },
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
});

