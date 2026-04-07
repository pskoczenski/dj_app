import { render, screen, within } from "@testing-library/react";

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

let mockUser: unknown = null;
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser }, error: null }),
    },
  })),
}));

import Home from "@/app/page";

describe("Landing page (Mirrorball manifesto)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
  });

  it("renders the tagline as the page h1", async () => {
    const Page = await Home();
    render(Page);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /keeping the dance floor honest/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders hero CTAs with correct routes", async () => {
    const Page = await Home();
    render(Page);

    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("link", { name: /create an account/i }),
    ).toHaveAttribute("href", "/signup");
    expect(within(main).getByRole("link", { name: /^login$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders the Mirrorball wordmark text", async () => {
    const Page = await Home();
    render(Page);
    expect(screen.getAllByText("Mirrorball").length).toBeGreaterThanOrEqual(1);
  });

  it("redirects authenticated users to /home", async () => {
    mockUser = { id: "user-1", email: "test@example.com" };

    try {
      await Home();
    } catch {
      // redirect throws in test environment
    }

    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });

  it("exposes a main landmark for the manifesto body", async () => {
    const Page = await Home();
    render(Page);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
