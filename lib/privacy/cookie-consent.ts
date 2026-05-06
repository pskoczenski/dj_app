import type { CookieStoreLike } from "@/lib/location/cookie";

export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_COOKIE_NAME = "mb_cookie_consent";
export const COOKIE_CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 180; // 180 days

export type CookieConsent = {
  version: number;
  updatedAt: string; // ISO
  categories: {
    necessary: true;
    functional: boolean;
  };
};

export function defaultConsent(): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    categories: {
      necessary: true,
      functional: false,
    },
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isCookieConsent(value: unknown): value is CookieConsent {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<CookieConsent>;
  if (typeof v.version !== "number") return false;
  if (typeof v.updatedAt !== "string") return false;
  const categories = (v as { categories?: unknown }).categories;
  if (!categories || typeof categories !== "object") return false;
  const c = categories as { necessary?: unknown; functional?: unknown };
  if (c.necessary !== true) return false;
  if (typeof c.functional !== "boolean") return false;
  return true;
}

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

function decodeConsentCookieValue(value: string): CookieConsent | null {
  const decoded = safeJsonParse(value);
  if (isCookieConsent(decoded)) return decoded;

  // base64-encoded JSON fallback (for older/alternate encodings)
  try {
    const json = atob(value);
    const parsed = safeJsonParse(json);
    if (isCookieConsent(parsed)) return parsed;
  } catch {
    // ignore
  }

  return null;
}

export function getConsentFromCookie(cookieStore?: CookieStoreLike): CookieConsent | null {
  const raw = cookieStore
    ? cookieStore.get(COOKIE_CONSENT_COOKIE_NAME)?.value?.trim()
    : readDocumentCookie(COOKIE_CONSENT_COOKIE_NAME)?.trim();
  if (!raw) return null;

  const parsed = decodeConsentCookieValue(raw);
  if (!parsed) return null;

  if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
  return parsed;
}

export function serializeConsent(consent: CookieConsent): string {
  return JSON.stringify(consent);
}

/** Client-only helper to set the consent cookie. */
export function setConsentCookie(consent: CookieConsent): void {
  if (typeof document === "undefined") return;

  const payload = serializeConsent(consent);
  const encoded = encodeURIComponent(payload);
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SEC}; SameSite=Lax`;
}

