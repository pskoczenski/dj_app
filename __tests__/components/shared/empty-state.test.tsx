import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/shared/empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No events found" />);
    expect(
      screen.getByRole("heading", { name: /no events found/i })
    ).toBeInTheDocument();
  });

  it("renders the optional description", () => {
    render(
      <EmptyState title="Empty" description="Try adjusting your filters." />
    );
    expect(
      screen.getByText("Try adjusting your filters.")
    ).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(
      <EmptyState
        title="No mixes"
        action={<button>Create a mix</button>}
      />
    );
    expect(
      screen.getByRole("button", { name: /create a mix/i })
    ).toBeInTheDocument();
  });
});
