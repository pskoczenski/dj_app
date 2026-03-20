/**
 * Canonical color tokens for DJ Network.
 * CSS variables in globals.css must match these values exactly.
 */
export const colors = {
  // Backgrounds
  deepLoam: "#121714",
  darkMoss: "#1A221D",
  forestShadow: "#232B26",

  // Borders
  rootLine: "#2A3B32",
  sageEdge: "#3D5347",

  // Primary
  fern: "#4A7C59",
  livingFern: "#5A9B6B",

  // Accent
  lichenGold: "#C9A227",
  driedGold: "#8B7320",

  // Text
  bone: "#E8E4DE",
  stone: "#A8B0A4",
  fog: "#6B7569",

  // Semantic
  newGrowth: "#3D6B4A",
  amberSap: "#9B7A2A",
  driedBlood: "#8B3A3A",
  rustMist: "#5C2828",

  // Special (reserved — use sparingly)
  neonMoss: "#7FFF00",
} as const;

export type ColorToken = keyof typeof colors;
