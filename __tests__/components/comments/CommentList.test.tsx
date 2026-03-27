import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentList } from "@/components/comments/CommentList";
import type { CommentWithAuthor } from "@/types";

jest.mock("@/lib/services/comment-likes", () => ({
  commentLikesService: {
    toggleLike: jest.fn().mockResolvedValue({ liked: false, likeCount: 0 }),
  },
}));

const baseComment = (overrides: Partial<CommentWithAuthor> = {}): CommentWithAuthor => ({
  id: "c1",
  body: "Line one\nLine two",
  created_at: "2019-01-15T12:00:00.000Z",
  updated_at: "2019-01-15T12:00:00.000Z",
  profile_id: "owner-1",
  author: {
    display_name: "Casey",
    slug: "casey",
    profile_image_url: null,
  },
  likeCount: 0,
  likedByMe: false,
  ...overrides,
});

describe("CommentList", () => {
  it("renders author, body with line breaks, and timestamp", () => {
    const onDelete = jest.fn();
    render(
      <CommentList
        comments={[baseComment()]}
        currentUserId="other"
        onDelete={onDelete}
        hasMore={false}
      />,
    );

    expect(screen.getByRole("link", { name: "Casey" })).toHaveAttribute("href", "/dj/casey");
    expect(screen.getByText(/line one/i)).toBeInTheDocument();
    expect(screen.getByText(/line two/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 15/i)).toBeInTheDocument();
  });

  it("shows delete only on current user's comments", () => {
    const onDelete = jest.fn();
    const { rerender } = render(
      <CommentList
        comments={[baseComment({ profile_id: "owner-1" })]}
        currentUserId="visitor"
        onDelete={onDelete}
        hasMore={false}
      />,
    );

    expect(screen.queryByRole("button", { name: /delete comment/i })).not.toBeInTheDocument();

    rerender(
      <CommentList
        comments={[baseComment({ profile_id: "owner-1" })]}
        currentUserId="owner-1"
        onDelete={onDelete}
        hasMore={false}
      />,
    );

    expect(screen.getByRole("button", { name: /delete comment/i })).toBeInTheDocument();
  });

  it("confirming delete calls onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <CommentList
        comments={[baseComment({ id: "cx", profile_id: "me" })]}
        currentUserId="me"
        onDelete={onDelete}
        hasMore={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete comment/i }));
    expect(screen.getByText(/delete\?/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(onDelete).toHaveBeenCalledWith("cx");
  });

  it("shows Load more when hasMore and calls onLoadMore", async () => {
    const user = userEvent.setup();
    const onLoadMore = jest.fn();
    render(
      <CommentList
        comments={[baseComment()]}
        currentUserId="x"
        onDelete={jest.fn()}
        onLoadMore={onLoadMore}
        hasMore
      />,
    );

    await user.click(screen.getByRole("button", { name: /load more comments/i }));

    expect(onLoadMore).toHaveBeenCalled();
  });
});
