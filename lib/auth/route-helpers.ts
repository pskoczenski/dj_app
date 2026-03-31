/**
 * Pure functions for route classification and redirect logic.
 * Used by middleware.ts — kept separate so they're testable in Jest.
 */

const PUBLIC_PATHS = ["/", "/login", "/signup"];

/**
 * Routes that require an authenticated session.
 * Anything starting with these prefixes (or exact matches for /(main) pages)
 * is protected. The route group name `(main)` is stripped by Next.js,
 * so the runtime paths are /home, /events, /dj/..., etc.
 */
const PROTECTED_PREFIXES = [
  "/home",
  "/events",
  "/dj",
  "/messages",
  "/profile",
  "/mixes",
  "/search",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

/**
 * Returns the URL to redirect an unauthenticated user to,
 * preserving the originally requested path as a query param.
 */
export function getLoginRedirectUrl(
  requestUrl: string,
  pathname: string
): string {
  const url = new URL("/login", requestUrl);
  url.searchParams.set("redirect", pathname);
  return url.toString();
}

/**
 * Returns the URL to redirect an already-authenticated user
 * away from auth pages.
 */
export function getHomeUrl(requestUrl: string): string {
  return new URL("/home", requestUrl).toString();
}
