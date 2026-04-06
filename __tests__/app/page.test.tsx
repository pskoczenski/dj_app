import { render, screen } from "@testing-library/react";

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

describe("Landing page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
  });

  it("renders CTAs when no user is logged in", async () => {
    const Page = await Home();
    render(Page);

    expect(
      screen.getByRole("heading", { level: 1, name: /mirrorball/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dance floor honest/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /home when user is logged in", async () => {
    mockUser = { id: "user-1", email: "test@example.com" };

    try {
      await Home();
    } catch {
      // redirect throws in test environment
    }

    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });

  it("renders a main landmark", async () => {
    const Page = await Home();
    render(Page);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
