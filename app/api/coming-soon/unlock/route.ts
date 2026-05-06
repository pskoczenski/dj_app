import { NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  comingSoonCookieName,
  createComingSoonCookieValue,
} from "@/lib/coming-soon/gate";

export const runtime = "nodejs";

function safeRedirectTarget(input: string | null | undefined): string {
  if (!input) return "/home";
  // Only allow in-app relative paths (no open redirects).
  if (!input.startsWith("/")) return "/home";
  return input;
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: Request) {
  const enabled = process.env.COMING_SOON_ENABLED === "true";
  if (!enabled) {
    // Gate disabled: behave like a no-op and redirect.
    const url = new URL(request.url);
    const form = await request.formData();
    const next = safeRedirectTarget(form.get("next")?.toString());
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const password = process.env.COMING_SOON_PASSWORD;
  const secret = process.env.COMING_SOON_GATE_SECRET;
  if (!password || !secret) {
    return new NextResponse("Coming soon gate is misconfigured.", {
      status: 500,
    });
  }

  const url = new URL(request.url);
  const form = await request.formData();

  const submittedPassword = form.get("password")?.toString() ?? "";
  const next = safeRedirectTarget(form.get("next")?.toString());

  if (!constantTimeEquals(submittedPassword, password)) {
    const redirectUrl = new URL("/coming-soon", url.origin);
    if (form.get("next")) redirectUrl.searchParams.set("next", next);
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl);
  }

  const token = randomBytes(32).toString("base64url");
  const cookieValue = await createComingSoonCookieValue({ secret, token });

  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.set(comingSoonCookieName, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

