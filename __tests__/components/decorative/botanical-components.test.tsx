import { render } from "@testing-library/react";
import { FernEmptyState } from "@/components/decorative/fern-empty-state";
import { RootLineDivider } from "@/components/decorative/root-line-divider";
import { CornerVineAccent } from "@/components/decorative/corner-vine-accent";
import { SporeCluster } from "@/components/decorative/spore-cluster";

describe("Botanical decorative components", () => {
  it("FernEmptyState is aria-hidden", () => {
    const { container } = render(<FernEmptyState />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("RootLineDivider is aria-hidden", () => {
    const { container } = render(<RootLineDivider />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("CornerVineAccent is aria-hidden", () => {
    const { container } = render(<CornerVineAccent />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("SporeCluster is aria-hidden", () => {
    const { container } = render(<SporeCluster />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
