import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";
import { createComingSoonCookieValue } from "@/lib/coming-soon/gate";

jest.mock("@/lib/supabase/middleware", () => ({
  updateSession: async () => ({
    response: NextResponse.next(),
    user: null,
  }),
}));

jest.mock("@/lib/auth/route-helpers", () => ({
  isProtectedPath: () => false,
  isAuthPage: () => false,
  getLoginRedirectUrl: () => "https://example.com/login",
  getHomeUrl: () => "https://example.com/home",
}));

function makeRequest(path: string, init?: { cookie?: string }) {
  return new NextRequest(new URL(path, "https://example.com"), {
    headers: init?.cookie ? { cookie: init.cookie } : undefined,
  });
}

describe("middleware coming-soon gate", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("redirects to /coming-soon when enabled and cookie missing", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    process.env.COMING_SOON_GATE_SECRET = "secret";

    const req = makeRequest("/events?x=1");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://example.com/coming-soon?next=%2Fevents%3Fx%3D1",
    );
  });

  it("allows /coming-soon itself through even when enabled", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    process.env.COMING_SOON_GATE_SECRET = "secret";

    const req = makeRequest("/coming-soon");
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("rewrites POST /coming-soon to the unlock API Route Handler", async () => {
    process.env.COMING_SOON_ENABLED = "false";

    const req = new NextRequest(
      new URL("/coming-soon?next=%2F", "https://example.com"),
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          password: "x",
          next: "/",
        }).toString(),
      },
    );
    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://example.com/api/coming-soon/unlock",
    );
  });

  it("allows request through when valid signed cookie is present", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    process.env.COMING_SOON_GATE_SECRET = "secret";

    const cookieValue = await createComingSoonCookieValue({
      secret: "secret",
      token: "dG9rZW4", // base64url-ish token
    });

    const req = makeRequest("/events", {
      cookie: `mb_gate=${cookieValue}`,
    });
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("fails closed (redirects) if enabled but secret is missing", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    delete process.env.COMING_SOON_GATE_SECRET;

    const req = makeRequest("/events");
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://example.com/coming-soon?next=%2Fevents",
    );
  });
});

