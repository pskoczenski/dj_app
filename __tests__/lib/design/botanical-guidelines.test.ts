import {
  BOTANICAL_OPACITY,
  BOTANICAL_USAGE_RULES,
} from "@/lib/design/botanical-guidelines";

describe("botanical guideline constants", () => {
  it("keeps decorative opacity defaults within spec ranges", () => {
    expect(BOTANICAL_OPACITY.fernEmptyState.default).toBeGreaterThanOrEqual(0.15);
    expect(BOTANICAL_OPACITY.fernEmptyState.default).toBeLessThanOrEqual(0.2);

    expect(BOTANICAL_OPACITY.rootLineDivider.default).toBeGreaterThanOrEqual(0.4);
    expect(BOTANICAL_OPACITY.rootLineDivider.default).toBeLessThanOrEqual(0.6);

    expect(BOTANICAL_OPACITY.cornerVineAccent.default).toBeGreaterThanOrEqual(0.1);
    expect(BOTANICAL_OPACITY.cornerVineAccent.default).toBeLessThanOrEqual(0.15);

    expect(BOTANICAL_OPACITY.sporeCluster.default).toBeGreaterThanOrEqual(0.4);
    expect(BOTANICAL_OPACITY.sporeCluster.default).toBeLessThanOrEqual(0.6);
  });

  it("enforces usage rules", () => {
    expect(BOTANICAL_USAGE_RULES.maxRootDividersPerPage).toBe(1);
    expect(BOTANICAL_USAGE_RULES.maxTreatmentsPerArea).toBe(1);
    expect(BOTANICAL_USAGE_RULES.disallowNeonMoss).toBe(true);
    expect(BOTANICAL_USAGE_RULES.preferredPalette).toEqual(["fern", "lichen-gold"]);
  });
});
