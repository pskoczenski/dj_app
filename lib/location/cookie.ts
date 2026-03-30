import {
  LOCATION_COOKIE_MAX_AGE_SEC,
  LOCATION_COOKIE_NAME,
} from "@/lib/location/constants";

export type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
};

function readDocumentCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`),
  );
  const raw = match?.[1];
  if (raw == null || raw === "") return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Read `dj_active_city` from a Next.js `cookies()` store (server) or omit to read
 * `document.cookie` (client only).
 */
export function getLocationCookie(cookieStore?: CookieStoreLike): string | null {
  if (cookieStore) {
    const v = cookieStore.get(LOCATION_COOKIE_NAME)?.value?.trim();
    return v || null;
  }
  const v = readDocumentCookie(LOCATION_COOKIE_NAME)?.trim();
  return v || null;
}

/** Client only — sets browse override city. */
export function setLocationCookie(cityId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCATION_COOKIE_NAME}=${encodeURIComponent(cityId)}; Path=/; Max-Age=${LOCATION_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

/** Client only — removes override; active location reverts to profile city. */
export function clearLocationCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCATION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
