import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    document.cookie = "mb_cookie_consent=; Path=/; Max-Age=0; SameSite=Lax";
  });

  it("renders when no consent exists", () => {
    render(<CookieConsentBanner />);
    expect(
      screen.getByRole("button", { name: /accept/i }),
    ).toBeInTheDocument();
  });

  it("reject optional writes cookie and hides", async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner />);

    await user.click(screen.getByRole("button", { name: /reject optional/i }));

    expect(document.cookie).toMatch(/mb_cookie_consent=/);
    expect(
      screen.queryByRole("button", { name: /accept/i }),
    ).not.toBeInTheDocument();
  });

  it("accept writes cookie and hides", async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner />);

    await user.click(screen.getByRole("button", { name: /^accept$/i }));

    expect(document.cookie).toMatch(/mb_cookie_consent=/);
    expect(
      screen.queryByRole("button", { name: /accept/i }),
    ).not.toBeInTheDocument();
  });
});

