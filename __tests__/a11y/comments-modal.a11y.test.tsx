import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

const useCommentsMock = jest.fn();
jest.mock("@/hooks/use-comments", () => ({
  useComments: (...args: unknown[]) => useCommentsMock(...args),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: { id: "user-1", email: "a@example.com" },
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { CommentsModal } from "@/components/comments/CommentsModal";

describe("a11y: comments modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCommentsMock.mockImplementation(() => ({
      comments: [],
      totalCount: 0,
      loading: false,
      hasMore: false,
      loadMore: jest.fn(),
      addComment: jest.fn(),
      deleteComment: jest.fn(),
      updateComment: jest.fn(),
    }));
  });

  it("has no axe violations when open", async () => {
    const { container } = render(
      <CommentsModal
        commentableType="event"
        commentableId="evt-1"
        title="Night Market"
        trigger={<button type="button">Open comments</button>}
        openByDefault
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

