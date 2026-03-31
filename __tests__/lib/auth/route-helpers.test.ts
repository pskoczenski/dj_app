import {
  isPublicPath,
  isProtectedPath,
  isAuthPage,
  getLoginRedirectUrl,
  getHomeUrl,
} from "@/lib/auth/route-helpers";

describe("isPublicPath", () => {
  it.each(["/", "/login", "/signup"])('"%s" is public', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/home", "/events", "/dj/some-slug"])(
    '"%s" is not public',
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    }
  );
});

describe("isProtectedPath", () => {
  it.each([
    "/home",
    "/events",
    "/events/create",
    "/events/abc-123",
    "/events/abc-123/edit",
    "/dj/cool-dj",
    "/messages",
    "/messages/abc-123",
    "/profile/edit",
    "/mixes",
    "/search",
  ])('"%s" is protected', (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/login", "/signup", "/about"])(
    '"%s" is not protected',
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    }
  );
});

describe("isAuthPage", () => {
  it("returns true for /login and /signup", () => {
    expect(isAuthPage("/login")).toBe(true);
    expect(isAuthPage("/signup")).toBe(true);
  });

  it("returns false for other paths", () => {
    expect(isAuthPage("/")).toBe(false);
    expect(isAuthPage("/home")).toBe(false);
  });
});

describe("getLoginRedirectUrl", () => {
  it("builds /login with redirect param", () => {
    const url = getLoginRedirectUrl("http://localhost:3000/home", "/home");
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("redirect")).toBe("/home");
  });

  it("preserves original path with segments", () => {
    const url = getLoginRedirectUrl(
      "http://localhost:3000/events/abc/edit",
      "/events/abc/edit"
    );
    expect(new URL(url).searchParams.get("redirect")).toBe(
      "/events/abc/edit"
    );
  });
});

describe("getHomeUrl", () => {
  it("returns /home", () => {
    const url = getHomeUrl("http://localhost:3000/login");
    expect(new URL(url).pathname).toBe("/home");
  });
});
