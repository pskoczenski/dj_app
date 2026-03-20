import { render, screen } from "@testing-library/react";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders with aria-busy for loading semantics", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-32" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-busy", "true");
  });
});
