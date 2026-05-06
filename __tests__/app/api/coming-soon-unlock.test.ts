import { POST } from "@/app/api/coming-soon/unlock/route";

function makeFormRequest(url: string, body: Record<string, string>) {
  const form = new URLSearchParams(body);
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
}

describe("POST /api/coming-soon/unlock", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("redirects back to /coming-soon with error=1 on wrong password and does not set cookie", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    process.env.COMING_SOON_PASSWORD = "correct";
    process.env.COMING_SOON_GATE_SECRET = "secret";

    const res = await POST(
      makeFormRequest("https://example.com/api/coming-soon/unlock", {
        password: "wrong",
        next: "/events",
      }),
    );

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "https://example.com/coming-soon?next=%2Fevents&error=1",
    );
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("sets httpOnly gate cookie and redirects to next on success", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    process.env.COMING_SOON_PASSWORD = "correct";
    process.env.COMING_SOON_GATE_SECRET = "secret";

    const res = await POST(
      makeFormRequest("https://example.com/api/coming-soon/unlock", {
        password: "correct",
        next: "/events?x=1",
      }),
    );

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://example.com/events?x=1");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("mb_gate=");
    expect(setCookie?.toLowerCase()).toContain("httponly");
    expect(setCookie).toContain("Path=/");
    expect(setCookie?.toLowerCase()).toContain("samesite=lax");
  });

  it("prevents open redirects by forcing non-relative next to /home", async () => {
    process.env.COMING_SOON_ENABLED = "true";
    process.env.COMING_SOON_PASSWORD = "correct";
    process.env.COMING_SOON_GATE_SECRET = "secret";

    const res = await POST(
      makeFormRequest("https://example.com/api/coming-soon/unlock", {
        password: "correct",
        next: "https://evil.com/phish",
      }),
    );

    expect(res.headers.get("location")).toBe("https://example.com/home");
  });
});

