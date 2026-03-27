import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockAddComment = jest.fn();
const mockDeleteComment = jest.fn();
const mockLoadMore = jest.fn();

const useCommentsMock = jest.fn();
jest.mock("@/hooks/use-comments", () => ({
  useComments: (...args: unknown[]) => useCommentsMock(...args),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: { id: "user-1", email: "a@example.com" },
  }),
}));

const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => mockToastError(...a),
    success: jest.fn(),
  },
}));

import { CommentsModal } from "@/components/comments/CommentsModal";

function defaultCommentsState(overrides: Partial<ReturnType<typeof useCommentsMock>> = {}) {
  return {
    comments: [] as never[],
    totalCount: 0,
    loading: false,
    hasMore: false,
    loadMore: mockLoadMore,
    addComment: mockAddComment,
    deleteComment: mockDeleteComment,
    refetch: jest.fn(),
    error: null,
    ...overrides,
  };
}

describe("CommentsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCommentsMock.mockImplementation(() => defaultCommentsState());
    mockAddComment.mockResolvedValue(undefined);
  });

  it("opens when trigger is clicked and shows the comment textarea", async () => {
    const user = userEvent.setup();
    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Night Market"
        trigger={<button type="button">Open comments</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open comments$/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/comment text/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: /night market/i })).toBeInTheDocument();
  });

  it("shows empty state when there are no comments", async () => {
    const user = userEvent.setup();
    useCommentsMock.mockImplementation(() =>
      defaultCommentsState({ comments: [], totalCount: 0, loading: false }),
    );

    render(
      <CommentsModal
        commentableType="mix"
        commentableId="mix-1"
        title="Summer Mix"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));

    expect(
      screen.getByText(/no comments yet — be the first/i),
    ).toBeInTheDocument();
  });

  it("renders comments from useComments", async () => {
    const user = userEvent.setup();
    useCommentsMock.mockImplementation(() =>
      defaultCommentsState({
        comments: [
          {
            id: "c1",
            body: "Great set!",
            created_at: "2020-06-01T12:00:00.000Z",
            updated_at: "2020-06-01T12:00:00.000Z",
            profile_id: "u2",
            author: {
              display_name: "DJ Sam",
              slug: "dj-sam",
              profile_image_url: null,
            },
            likeCount: 2,
            likedByMe: false,
          },
        ] as never[],
        totalCount: 1,
        loading: false,
      }),
    );

    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Rave"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));

    expect(screen.getByText("Great set!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DJ Sam" })).toHaveAttribute(
      "href",
      "/dj/dj-sam",
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("disables Post when textarea is empty", async () => {
    const user = userEvent.setup();
    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Event"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("button", { name: /^post$/i })).toBeDisabled();
  });

  it("posts trimmed body when Post is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Event"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    const dialog = screen.getByRole("dialog");
    const textarea = within(dialog).getByLabelText(/comment text/i);
    await user.type(textarea, "  hi there  ");

    await user.click(within(dialog).getByRole("button", { name: /^post$/i }));

    expect(mockAddComment).toHaveBeenCalledWith("hi there");
  });

  it("clears textarea after successful post", async () => {
    const user = userEvent.setup();
    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Event"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    const dialog = screen.getByRole("dialog");
    const textarea = within(dialog).getByLabelText(/comment text/i);
    await user.type(textarea, "yo");

    await user.click(within(dialog).getByRole("button", { name: /^post$/i }));

    expect(textarea).toHaveValue("");
  });

  it("preserves textarea and surfaces toast when addComment fails", async () => {
    const user = userEvent.setup();
    mockAddComment.mockImplementationOnce(async () => {
      mockToastError("Could not add comment.");
      throw new Error("network");
    });

    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Event"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    const dialog = screen.getByRole("dialog");
    const textarea = within(dialog).getByLabelText(/comment text/i);
    await user.type(textarea, "keep me");

    await user.click(within(dialog).getByRole("button", { name: /^post$/i }));

    await screen.findByText("keep me");
    expect(textarea).toHaveValue("keep me");
    expect(mockToastError).toHaveBeenCalledWith("Could not add comment.");
  });

  it("clears draft after close and reopen", async () => {
    const user = userEvent.setup();
    render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Event"
        trigger={<button type="button">Open</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    let dialog = screen.getByRole("dialog");
    const textarea = within(dialog).getByLabelText(/comment text/i);
    await user.type(textarea, "draft text");

    await user.click(within(dialog).getByRole("button", { name: /close/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/comment text/i)).toHaveValue("");
  });
});
