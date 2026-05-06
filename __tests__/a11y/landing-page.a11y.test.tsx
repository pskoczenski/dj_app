import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

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

describe("a11y: landing page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
  });

  it("has no axe violations", async () => {
    const Page = await Home();
    const { container } = render(Page);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

