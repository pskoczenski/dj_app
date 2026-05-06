import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_VERSION,
  defaultConsent,
  getConsentFromCookie,
  serializeConsent,
  type CookieConsent,
} from "@/lib/privacy/cookie-consent";

function setDocumentCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

describe("cookie consent helpers", () => {
  beforeEach(() => {
    // Reset cookie jar in jsdom
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  });

  it("returns null when cookie is missing", () => {
    expect(getConsentFromCookie()).toBeNull();
  });

  it("parses a valid JSON consent cookie", () => {
    const consent: CookieConsent = {
      version: COOKIE_CONSENT_VERSION,
      updatedAt: "2026-05-06T00:00:00.000Z",
      categories: { necessary: true, functional: true },
    };
    setDocumentCookie(COOKIE_CONSENT_COOKIE_NAME, serializeConsent(consent));
    expect(getConsentFromCookie()).toEqual(consent);
  });

  it("returns null for invalid JSON", () => {
    setDocumentCookie(COOKIE_CONSENT_COOKIE_NAME, "{not-json");
    expect(getConsentFromCookie()).toBeNull();
  });

  it("returns null when version mismatches", () => {
    const consent = defaultConsent();
    setDocumentCookie(
      COOKIE_CONSENT_COOKIE_NAME,
      serializeConsent({ ...consent, version: consent.version + 1 }),
    );
    expect(getConsentFromCookie()).toBeNull();
  });
});

