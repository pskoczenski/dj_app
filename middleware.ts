import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  isProtectedPath,
  isAuthPage,
  getLoginRedirectUrl,
  getHomeUrl,
} from "@/lib/auth/route-helpers";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
