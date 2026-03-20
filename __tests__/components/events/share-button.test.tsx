import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButton } from "@/components/events/share-button";

describe("ShareButton", () => {
  it("renders a share button", () => {
    render(<ShareButton title="Test Event" />);
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("shows Copied! after clicking", async () => {
    const user = userEvent.setup();
    render(<ShareButton title="Test Event" url="https://example.com/evt/1" />);

    const btn = screen.getByRole("button", { name: /share/i });
    await user.click(btn);

    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });
});
