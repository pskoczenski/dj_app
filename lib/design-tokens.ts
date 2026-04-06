/**
 * Canonical Mirrorball color tokens.
 * CSS variables in app/globals.css must match these values exactly.
 */
export const mirrorballColors = {
  surface0: "#161310",
  surface1: "#1c1815",
  surface2: "#221e1a",
  surface3: "#2a2520",
  surface4: "#332d27",
  turquoiseDeep: "#2d5a5a",
  turquoiseMid: "#4a8585",
  turquoisePale: "#7ab0b0",
  turquoiseIce: "#a8ccc8",
  textPrimary: "#ebe6df",
  textSecondary: "#9a938a",
  textTertiary: "#6b6560",
} as const;

export type MirrorballColorToken = keyof typeof mirrorballColors;
