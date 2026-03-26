import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/layout/navbar";
import type { CurrentUser } from "@/hooks/use-current-user";

const mockPush = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
  usePathname: () => "/home",
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut },
  }),
}));

const mockUnreadCount = jest.fn();
jest.mock("@/hooks/use-unread-count", () => ({
  useUnreadCount: () => ({ count: mockUnreadCount() }),
}));

const mockUser: CurrentUser = {
  id: "user-1",
  displayName: "DJ Shadow",
  slug: "dj-shadow",
  avatarUrl: null,
  profileType: "dj",
};

describe("Navbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnreadCount.mockReturnValue(0);
  });

  it("renders nav links", () => {
    render(<Navbar user={mockUser} />);

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByRole("link", { name: /events/i })).toHaveAttribute(
      "href",
      "/events",
    );
    expect(screen.getByRole("link", { name: /mixes/i })).toHaveAttribute(
      "href",
      "/mixes",
    );
    expect(screen.getByRole("link", { name: /messages/i })).toHaveAttribute(
      "href",
      "/messages",
    );
  });

  it("renders search link", () => {
    render(<Navbar user={mockUser} />);
    expect(screen.getByRole("link", { name: /search/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("shows unread badge when unread count > 0", () => {
    mockUnreadCount.mockReturnValue(12);
    render(<Navbar user={mockUser} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("renders the logo linking to /home", () => {
    render(<Navbar user={mockUser} />);
    expect(screen.getByText("DJ Network")).toBeInTheDocument();
  });

  it("shows user menu trigger when logged in", () => {
    render(<Navbar user={mockUser} />);
    expect(screen.getByLabelText("User menu")).toBeInTheDocument();
  });

  it("log out calls signOut and redirects to /", async () => {
    const user = userEvent.setup();
    render(<Navbar user={mockUser} />);

    await user.click(screen.getByLabelText("User menu"));

    const logOutItem = await screen.findByText("Log out");
    await user.click(logOutItem);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
