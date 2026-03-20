import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/layout/navbar";
import type { CurrentUser } from "@/hooks/use-current-user";

const mockPush = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/home",
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut },
  }),
}));

const mockUser: CurrentUser = {
  id: "user-1",
  displayName: "DJ Shadow",
  slug: "dj-shadow",
  avatarUrl: null,
  profileType: "dj",
};

describe("Navbar", () => {
  beforeEach(() => jest.clearAllMocks());

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
  });

  it("renders search link", () => {
    render(<Navbar user={mockUser} />);
    expect(screen.getByRole("link", { name: /search/i })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("renders the logo linking to /home", () => {
    render(<Navbar user={mockUser} />);
    expect(screen.getByText("DJ Network")).toBeInTheDocument();
  });

  it("shows avatar with user initials", () => {
    render(<Navbar user={mockUser} />);
    expect(screen.getByText("DS")).toBeInTheDocument();
  });

  it("log out calls signOut and redirects to /", async () => {
    const user = userEvent.setup();
    render(<Navbar user={mockUser} />);

    await user.click(screen.getByLabelText("User menu"));

    const logOutItem = await screen.findByText("Log Out");
    await user.click(logOutItem);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
