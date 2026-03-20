import { render } from "@testing-library/react";
import { LithographWaves } from "@/components/decorative/lithograph-waves";

describe("LithographWaves", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<LithographWaves />);
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("is not focusable (pointer-events-none)", () => {
    const { container } = render(<LithographWaves />);
    const el = container.firstElementChild!;
    expect(el.className).toContain("pointer-events-none");
  });

  it("applies custom opacity", () => {
    const { container } = render(<LithographWaves opacity={0.05} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe("0.05");
  });
});
