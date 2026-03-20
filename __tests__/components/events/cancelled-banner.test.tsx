import { render, screen } from "@testing-library/react";
import { CancelledBanner } from "@/components/events/cancelled-banner";

describe("CancelledBanner", () => {
  it("renders the cancellation message", () => {
    render(<CancelledBanner />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /this event has been cancelled/i,
    );
  });
});
