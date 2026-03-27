import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MixCard } from "@/components/mixes/mix-card";
import type { MixWithCreator } from "@/types";

jest.mock("@/hooks/use-comment-count", () => ({
  useCommentCount: () => ({ count: 9, loading: false }),
}));

jest.mock("@/hooks/use-comments", () => ({
  useComments: () => ({
    comments: [],
    totalCount: 0,
    loading: false,
    hasMore: false,
    loadMore: jest.fn(),
    addComment: jest.fn().mockResolvedValue(undefined),
    deleteComment: jest.fn(),
    refetch: jest.fn(),
    error: null,
  }),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ user: { id: "u-test" } }),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/mixes",
}));

const mockToggleLike = jest.fn();
jest.mock("@/lib/services/mix-likes", () => ({
  mixLikesService: {
    toggleLike: (...a: unknown[]) => mockToggleLike(...a),
    getLikedMixIdsForUser: jest.fn(),
  },
}));

const MOCK_MIX: MixWithCreator = {
  id: "mix-1",
  title: "Summer Vibes",
  embed_url: "https://soundcloud.com/artist/summer-vibes",
  platform: "soundcloud",
  profile_id: "user-1",
  description: "A chill summer mix.",
  genres: ["house", "deep house"],
  cover_image_url: null,
  duration: "1:32:00",
  sort_order: 0,
  likes_count: 7,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
  deleted_at: null,
  creator: { display_name: "Test DJ", slug: "test-dj" },
};

describe("MixCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleLike.mockResolvedValue({ liked: true, likesCount: 8 });
  });

  it("renders the mix title and platform badge", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("Summer Vibes")).toBeInTheDocument();
    expect(screen.getByText("SoundCloud")).toBeInTheDocument();
  });

  it("shows likes count and like control", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    const likeBtn = screen.getByLabelText(/like this mix/i);
    expect(likeBtn).toBeInTheDocument();
    expect(likeBtn).toHaveTextContent("7");
  });

  it("redirects to login when unauthenticated user taps like", async () => {
    const user = userEvent.setup();
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );

    await user.click(screen.getByLabelText(/like this mix/i));

    expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fmixes");
    expect(mockToggleLike).not.toHaveBeenCalled();
  });

  it("toggles like when authenticated", async () => {
    const user = userEvent.setup();
    const onLikeChange = jest.fn();
    render(
      <MixCard
        mix={MOCK_MIX}
        expanded={false}
        onToggle={jest.fn()}
        currentUserId="user-2"
        onLikeChange={onLikeChange}
      />,
    );

    await user.click(screen.getByLabelText(/like this mix/i));

    expect(mockToggleLike).toHaveBeenCalledWith("mix-1", "user-2");
    expect(onLikeChange).toHaveBeenCalledWith({
      liked: true,
      likesCount: 8,
    });
  });

  it("renders creator name, profile link, and added date", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    const nameLink = screen.getByRole("link", { name: "Test DJ" });
    expect(nameLink).toHaveAttribute("href", "/dj/test-dj");
    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.getByText("01/01/25")).toBeInTheDocument();
  });

  it("renders genre badges", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("house")).toBeInTheDocument();
    expect(screen.getByText("deep house")).toBeInTheDocument();
  });

  it("renders duration", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("1:32:00")).toBeInTheDocument();
  });

  it("does not show embed when collapsed", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.queryByTitle("Summer Vibes")).not.toBeInTheDocument();
  });

  it("shows embed when expanded", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={true} onToggle={jest.fn()} />,
    );
    const iframe = screen.getByTitle("Summer Vibes");
    expect(iframe.tagName).toBe("IFRAME");
  });

  it("shows description when expanded", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={true} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("A chill summer mix.")).toBeInTheDocument();
  });

  it("calls onToggle when title button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={onToggle} />,
    );

    await user.click(
      screen.getByRole("button", { name: /summer vibes/i }),
    );
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("has aria-expanded on the toggle button", () => {
    const { rerender } = render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /summer vibes/i }),
    ).toHaveAttribute("aria-expanded", "false");

    rerender(
      <MixCard mix={MOCK_MIX} expanded={true} onToggle={jest.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /summer vibes/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("manageMode delete button calls onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <MixCard
        mix={MOCK_MIX}
        expanded={false}
        onToggle={jest.fn()}
        manageMode
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete mix/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders comment count and opens comments modal without toggling expand", async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={onToggle} />,
    );

    await user.click(screen.getByRole("button", { name: /9 comments/i }));

    expect(onToggle).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /summer vibes/i }),
    ).toBeInTheDocument();
  });
});
