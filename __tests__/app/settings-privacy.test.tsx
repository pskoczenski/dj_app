import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/use-privacy-actions", () => ({
  usePrivacyActions: () => ({
    exportMyData: jest.fn(),
    deleteMyAccount: jest.fn(),
    exporting: false,
    deleting: false,
  }),
}));

import PrivacySettingsPage from "@/app/(main)/settings/privacy/page";

describe("Privacy settings page", () => {
  it("renders export and delete controls", () => {
    render(<PrivacySettingsPage />);

    expect(
      screen.getByRole("button", { name: /download my data/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete my account/i }),
    ).toBeInTheDocument();
  });
});

