import { NextResponse } from "next/server";
import { comingSoonCookieName } from "@/lib/coming-soon/gate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const url = new URL(request.url);

  const res = NextResponse.redirect(new URL("/coming-soon", url.origin), 303);
  res.cookies.set(comingSoonCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}

