import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  isProtectedPath,
  isAuthPage,
  getLoginRedirectUrl,
  getHomeUrl,
} from "@/lib/auth/route-helpers";
import {
  comingSoonCookieName,
  verifyComingSoonCookieValue,
} from "@/lib/coming-soon/gate";

/** Forward Supabase session cookies — required on redirects or refreshed tokens are lost. */
function withSupabaseCookies(
  supabaseResponse: NextResponse,
  target: NextResponse,
): NextResponse {
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
  return target;
}

function isComingSoonAllowlistedPath(pathname: string): boolean {
  if (pathname === "/coming-soon" || pathname === "/coming-soon/") return true;
  if (pathname === "/api/coming-soon/unlock") return true;
  if (pathname === "/api/coming-soon/lock") return true;

  // Next internals and common public assets
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;

  // Broad but safe: allow typical public static asset extensions
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$/.test(pathname))
    return true;

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prerender/static shells may answer POST /coming-soon with 405 even when the
  // form targets /api/coming-soon/unlock (edge/CDN quirks). Rewrite so the Route
  // Handler always receives the submission.
  if (
    request.method === "POST" &&
    (pathname === "/coming-soon" || pathname === "/coming-soon/")
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/api/coming-soon/unlock";
    rewriteUrl.search = "";
    return NextResponse.rewrite(rewriteUrl);
  }

  if (process.env.COMING_SOON_ENABLED === "true") {
    const secret = process.env.COMING_SOON_GATE_SECRET;

    // If misconfigured, fail closed: gate everything except the allowlist
    const cookieValue = request.cookies.get(comingSoonCookieName)?.value;
    const hasValidGate =
      !!secret &&
      (await verifyComingSoonCookieValue({ secret, value: cookieValue }));

    if (!hasValidGate && !isComingSoonAllowlistedPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/coming-soon";
      redirectUrl.search = "";
      redirectUrl.searchParams.set(
        "next",
        request.nextUrl.pathname + request.nextUrl.search,
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  const { response, user } = await updateSession(request);

  if (isProtectedPath(pathname) && !user) {
    const redirect = NextResponse.redirect(
      getLoginRedirectUrl(request.url, pathname),
    );
    return withSupabaseCookies(response, redirect);
  }

  if (isAuthPage(pathname) && user) {
    const redirect = NextResponse.redirect(getHomeUrl(request.url));
    return withSupabaseCookies(response, redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

