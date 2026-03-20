import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  isProtectedPath,
  isAuthPage,
  getLoginRedirectUrl,
  getHomeUrl,
} from "@/lib/auth/route-helpers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (isProtectedPath(pathname) && !user) {
    return NextResponse.redirect(getLoginRedirectUrl(request.url, pathname));
  }

  if (isAuthPage(pathname) && user) {
    return NextResponse.redirect(getHomeUrl(request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
