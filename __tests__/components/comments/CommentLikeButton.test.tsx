import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentLikeButton } from "@/components/comments/CommentLikeButton";

const mockToggleLike = jest.fn();
jest.mock("@/lib/services/comment-likes", () => ({
  commentLikesService: {
    toggleLike: (...a: unknown[]) => mockToggleLike(...a),
  },
}));

describe("CommentLikeButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders outlined heart and omits zero count", () => {
    mockToggleLike.mockResolvedValue({ liked: true, likeCount: 1 });
    render(
      <CommentLikeButton
        commentId="c1"
        initialLiked={false}
        initialCount={0}
      />,
    );

    const btn = screen.getByRole("button", { name: /like comment/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn.textContent).not.toMatch(/\d/);
  });

  it("renders filled state and count when liked", () => {
    mockToggleLike.mockResolvedValue({ liked: false, likeCount: 2 });
    render(
      <CommentLikeButton
        commentId="c1"
        initialLiked
        initialCount={3}
      />,
    );

    expect(
      screen.getByRole("button", { name: /unlike comment/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("optimistically updates liked state and count, then syncs from API", async () => {
    const user = userEvent.setup();
    mockToggleLike.mockResolvedValue({ liked: true, likeCount: 2 });
    render(
      <CommentLikeButton
        commentId="c1"
        initialLiked={false}
        initialCount={1}
      />,
    );

    await user.click(screen.getByRole("button", { name: /like comment/i }));

    expect(mockToggleLike).toHaveBeenCalledWith("c1");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /unlike comment/i }),
      ).toHaveAttribute("aria-pressed", "true");
    });
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
