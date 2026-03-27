import { act, renderHook } from "@testing-library/react";

const mockToggleLike = jest.fn();
const mockToastError = jest.fn();

jest.mock("@/lib/services/comment-likes", () => ({
  commentLikesService: {
    toggleLike: (...a: unknown[]) => mockToggleLike(...a),
    getLikedCommentIds: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => mockToastError(...a),
  },
}));

import { useCommentLike } from "@/hooks/use-comment-like";

describe("useCommentLike", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("toggleLike updates optimistically then settles to service result", async () => {
    mockToggleLike.mockResolvedValueOnce({ liked: true, likeCount: 4 });
    const { result } = renderHook(() => useCommentLike("c1", false, 3));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(result.current.liked).toBe(true);
    expect(result.current.likeCount).toBe(4);
  });

  it("reverts optimistic state on error", async () => {
    mockToggleLike.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useCommentLike("c1", false, 3));

    await expect(
      act(async () => {
        await result.current.toggleLike();
      }),
    ).rejects.toThrow("boom");

    expect(result.current.liked).toBe(false);
    expect(result.current.likeCount).toBe(3);
    expect(mockToastError).toHaveBeenCalled();
  });
});

