import type { CookieConsent } from "@/lib/privacy/cookie-consent";

export function hasFunctionalConsent(consent: CookieConsent | null): boolean {
  return Boolean(consent?.categories.functional);
}

