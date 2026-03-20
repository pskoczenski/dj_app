import { render, screen } from "@testing-library/react";
import { Icon, toneClass } from "@/components/icons/icon";
import type { IconTone, IconSize } from "@/components/icons/icon";
import { Heart } from "lucide-react";

describe("Icon", () => {
  it("renders aria-hidden by default (decorative)", () => {
    const { container } = render(<Icon icon={Heart} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders with aria-label and role=img when label is provided", () => {
    render(<Icon icon={Heart} label="Favorite" />);
    expect(screen.getByRole("img", { name: "Favorite" })).toBeInTheDocument();
  });

  it.each([
    ["default", "text-stone"],
    ["active", "text-bone"],
    ["primary", "text-fern"],
    ["muted", "text-fog"],
    ["accent", "text-lichen-gold"],
  ] as [IconTone, string][])(
    "tone %s applies class %s",
    (tone, expected) => {
      const { container } = render(<Icon icon={Heart} tone={tone} />);
      expect(container.querySelector("svg")!.className.baseVal ?? container.querySelector("svg")!.getAttribute("class")).toContain(expected);
    },
  );

  it.each([
    ["sm", 16],
    ["md", 20],
    ["lg", 24],
  ] as [IconSize, number][])(
    "size %s renders at %ipx",
    (size, pixels) => {
      const { container } = render(<Icon icon={Heart} size={size} />);
      const svg = container.querySelector("svg")!;
      expect(svg).toHaveAttribute("width", String(pixels));
      expect(svg).toHaveAttribute("height", String(pixels));
    },
  );

  it("unit: toneClass maps match spec color tokens", () => {
    expect(toneClass).toEqual({
      default: "text-stone",
      active: "text-bone",
      primary: "text-fern",
      muted: "text-fog",
      accent: "text-lichen-gold",
    });
  });
});
