export const BOTANICAL_OPACITY = {
  fernEmptyState: { min: 0.15, max: 0.2, default: 0.18 },
  rootLineDivider: { min: 0.4, max: 0.6, default: 0.5 },
  cornerVineAccent: { min: 0.1, max: 0.15, default: 0.12 },
  sporeCluster: { min: 0.4, max: 0.6, default: 0.5 },
} as const;

export const BOTANICAL_USAGE_RULES = {
  maxRootDividersPerPage: 1,
  maxTreatmentsPerArea: 1,
  preferredPalette: ["fern", "lichen-gold"] as const,
  disallowNeonMoss: true,
} as const;
