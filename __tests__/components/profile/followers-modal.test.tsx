import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useFollowListMock = jest.fn();
jest.mock("@/hooks/use-follow-list", () => ({
  useFollowList: (...args: unknown[]) => useFollowListMock(...args),
}));

const useCurrentUserMock = jest.fn();
jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

const mockFollow = jest.fn();
const mockUnfollow = jest.fn();
const mockGetFollowing = jest.fn();
jest.mock("@/lib/services/follows", () => ({
  followsService: {
    follow: (...args: unknown[]) => mockFollow(...args),
    unfollow: (...args: unknown[]) => mockUnfollow(...args),
    getFollowing: (...args: unknown[]) => mockGetFollowing(...args),
  },
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

import { FollowersModal } from "@/components/profile/followers-modal";

const CURRENT_USER = { id: "me", email: "me@example.com" };

const PROFILE_A = {
  id: "p1",
  display_name: "DJ Alpha",
  slug: "dj-alpha",
  profile_image_url: null,
};

const PROFILE_B = {
  id: "p2",
  display_name: "DJ Beta",
  slug: "dj-beta",
  profile_image_url: "https://example.com/beta.jpg",
};

function renderModal(overrides: Partial<React.ComponentProps<typeof FollowersModal>> = {}) {
  const props = {
    open: true,
    onOpenChange: jest.fn(),
    profileId: "profile-1",
    type: "followers" as const,
    title: "3 followers",
    ...overrides,
  };
  return { ...render(<FollowersModal {...props} />), onOpenChange: props.onOpenChange };
}

describe("FollowersModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFollowListMock.mockReturnValue({ profiles: [], loading: false });
    useCurrentUserMock.mockReturnValue({ user: CURRENT_USER });
    mockGetFollowing.mockResolvedValue([]);
    mockFollow.mockResolvedValue(undefined);
    mockUnfollow.mockResolvedValue(undefined);
  });

  it("does not render when closed", () => {
    useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
    renderModal({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the title when open", () => {
    renderModal({ title: "5 followers" });
    expect(screen.getByRole("heading", { name: /5 followers/i })).toBeInTheDocument();
  });

  it("shows loading spinner while loading", () => {
    useFollowListMock.mockReturnValue({ profiles: [], loading: true });
    renderModal();
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("shows followers empty state message", () => {
    renderModal({ type: "followers" });
    expect(screen.getByText(/no followers yet/i)).toBeInTheDocument();
  });

  it("shows following empty state message", () => {
    renderModal({ type: "following" });
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument();
  });

  it("renders profile list with display names and links", () => {
    useFollowListMock.mockReturnValue({ profiles: [PROFILE_A, PROFILE_B], loading: false });
    renderModal();
    expect(screen.getByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dj alpha/i })).toHaveAttribute("href", "/dj/dj-alpha");
    expect(screen.getByRole("link", { name: /dj beta/i })).toHaveAttribute("href", "/dj/dj-beta");
  });

  it("renders slugs as @handle", () => {
    useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
    renderModal();
    expect(screen.getByText("@dj-alpha")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when a profile link is clicked", async () => {
    const user = userEvent.setup();
    useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
    const { onOpenChange } = renderModal();
    await user.click(screen.getByRole("link", { name: /dj alpha/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  describe("follow buttons", () => {
    it("shows Follow button for profiles not yet followed", () => {
      mockGetFollowing.mockResolvedValue([]);
      useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
      renderModal();
      expect(screen.getByRole("button", { name: /^follow$/i })).toBeInTheDocument();
    });

    it("shows Following button for profiles already followed", async () => {
      mockGetFollowing.mockResolvedValue([PROFILE_A]);
      useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
      renderModal();
      expect(await screen.findByRole("button", { name: /^following$/i })).toBeInTheDocument();
    });

    it("does not show a follow button for the current user's own profile", () => {
      useFollowListMock.mockReturnValue({
        profiles: [{ ...PROFILE_A, id: CURRENT_USER.id }],
        loading: false,
      });
      renderModal();
      expect(screen.queryByRole("button", { name: /follow/i })).not.toBeInTheDocument();
    });

    it("does not show follow buttons when not logged in", () => {
      useCurrentUserMock.mockReturnValue({ user: null });
      useFollowListMock.mockReturnValue({ profiles: [PROFILE_A, PROFILE_B], loading: false });
      renderModal();
      expect(screen.queryByRole("button", { name: /follow/i })).not.toBeInTheDocument();
    });

    it("optimistically updates to Following after clicking Follow", async () => {
      const user = userEvent.setup();
      mockGetFollowing.mockResolvedValue([]);
      useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
      renderModal();

      await user.click(screen.getByRole("button", { name: /^follow$/i }));

      expect(await screen.findByRole("button", { name: /^following$/i })).toBeInTheDocument();
      expect(mockFollow).toHaveBeenCalledWith(CURRENT_USER.id, PROFILE_A.id);
    });

    it("optimistically updates to Follow after clicking Following", async () => {
      const user = userEvent.setup();
      mockGetFollowing.mockResolvedValue([PROFILE_A]);
      useFollowListMock.mockReturnValue({ profiles: [PROFILE_A], loading: false });
      renderModal();

      const followingBtn = await screen.findByRole("button", { name: /^following$/i });
      await user.click(followingBtn);

      expect(await screen.findByRole("button", { name: /^follow$/i })).toBeInTheDocument();
      expect(mockUnfollow).toHaveBeenCalledWith(CURRENT_USER.id, PROFILE_A.id);
    });

    it("shows separate follow buttons for each unfollowed profile", () => {
      mockGetFollowing.mockResolvedValue([]);
      useFollowListMock.mockReturnValue({ profiles: [PROFILE_A, PROFILE_B], loading: false });
      renderModal();
      const followBtns = screen.getAllByRole("button", { name: /^follow$/i });
      expect(followBtns).toHaveLength(2);
    });

    it("fetches current user following set with getFollowing on open", () => {
      renderModal({ open: true });
      expect(mockGetFollowing).toHaveBeenCalledWith(CURRENT_USER.id);
    });

    it("does not fetch following set when modal is closed", () => {
      renderModal({ open: false });
      expect(mockGetFollowing).not.toHaveBeenCalled();
    });
  });
});
