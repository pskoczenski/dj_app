import { prefersReducedMotion } from "@/lib/utils/prefers-reduced-motion";

describe("prefersReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns true when reduce is preferred", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
  });

  it("returns false when reduce is not preferred", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });
});
