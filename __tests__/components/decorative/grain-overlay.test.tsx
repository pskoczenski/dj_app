import { render, screen } from "@testing-library/react";
import { GrainOverlay } from "@/components/decorative/grain-overlay";

describe("GrainOverlay", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<GrainOverlay />);
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("is not focusable (pointer-events-none)", () => {
    const { container } = render(<GrainOverlay />);
    const el = container.firstElementChild!;
    expect(el.className).toContain("pointer-events-none");
  });

  it("applies custom opacity", () => {
    const { container } = render(<GrainOverlay opacity={0.03} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe("0.03");
  });

  it("does not contain any focusable elements", () => {
    const { container } = render(<GrainOverlay />);
    const focusable = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable).toHaveLength(0);
  });
});
