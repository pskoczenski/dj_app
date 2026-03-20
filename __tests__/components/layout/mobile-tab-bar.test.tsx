import { render, screen } from "@testing-library/react";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import type { CurrentUser } from "@/hooks/use-current-user";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/home",
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

const mockUser: CurrentUser = {
  id: "user-1",
  displayName: "DJ Shadow",
  slug: "dj-shadow",
  avatarUrl: null,
  profileType: "dj",
};

describe("MobileTabBar", () => {
  it("renders five navigation targets", () => {
    render(<MobileTabBar user={mockUser} />);

    expect(screen.getByLabelText("Home")).toBeInTheDocument();
    expect(screen.getByLabelText("Events")).toBeInTheDocument();
    expect(screen.getByLabelText("Quick create")).toBeInTheDocument();
    expect(screen.getByLabelText("Mixes")).toBeInTheDocument();
    expect(screen.getByLabelText("Me")).toBeInTheDocument();
  });

  it("links Home to /home", () => {
    render(<MobileTabBar user={mockUser} />);
    expect(screen.getByLabelText("Home")).toHaveAttribute("href", "/home");
  });

  it("links Me to the user's profile", () => {
    render(<MobileTabBar user={mockUser} />);
    expect(screen.getByLabelText("Me")).toHaveAttribute(
      "href",
      "/dj/dj-shadow",
    );
  });
});
