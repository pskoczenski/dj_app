import { render, screen } from "@testing-library/react";

import PrivacyPage from "@/app/(auth)/privacy/page";
import TermsPage from "@/app/(auth)/terms/page";
import GuidelinesPage from "@/app/(auth)/guidelines/page";
import DmcaPage from "@/app/(auth)/dmca/page";
import ContactPage from "@/app/(auth)/contact/page";

describe("Legal pages", () => {
  it("renders Privacy heading", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /privacy policy/i }),
    ).toBeInTheDocument();
  });

  it("renders Terms heading", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /terms of service/i }),
    ).toBeInTheDocument();
  });

  it("renders Guidelines heading", () => {
    render(<GuidelinesPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /community guidelines/i }),
    ).toBeInTheDocument();
  });

  it("renders DMCA heading", () => {
    render(<DmcaPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /dmca/i }),
    ).toBeInTheDocument();
  });

  it("renders Contact heading", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /contact/i }),
    ).toBeInTheDocument();
  });
});

