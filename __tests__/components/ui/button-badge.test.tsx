import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

describe("UI primitives style variants", () => {
  it("Button variants render with distinct data-variant values", () => {
    render(
      <div>
        <Button variant="default">Primary</Button>
        <Button variant="outline">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Danger</Button>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Primary" })).toHaveAttribute(
      "data-variant",
      "default",
    );
    expect(screen.getByRole("button", { name: "Secondary" })).toHaveAttribute(
      "data-variant",
      "outline",
    );
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveAttribute(
      "data-variant",
      "ghost",
    );
    expect(screen.getByRole("button", { name: "Danger" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });

  it("Badge status variants render with expected variant markers", () => {
    render(
      <div>
        <Badge variant="published">Published</Badge>
        <Badge variant="draft">Draft</Badge>
        <Badge variant="cancelled">Cancelled</Badge>
      </div>,
    );

    expect(screen.getByText("Published").className).toContain("bg-new-growth/20");
    expect(screen.getByText("Draft").className).toContain("bg-forest-shadow");
    expect(screen.getByText("Cancelled").className).toContain("bg-rust-mist");
  });
});
