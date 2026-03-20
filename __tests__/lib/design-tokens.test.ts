import { colors } from "@/lib/design-tokens";

describe("Design tokens — color palette", () => {
  const expected: Record<string, string> = {
    deepLoam: "#121714",
    darkMoss: "#1A221D",
    forestShadow: "#232B26",
    rootLine: "#2A3B32",
    sageEdge: "#3D5347",
    fern: "#4A7C59",
    livingFern: "#5A9B6B",
    lichenGold: "#C9A227",
    driedGold: "#8B7320",
    bone: "#E8E4DE",
    stone: "#A8B0A4",
    fog: "#6B7569",
    newGrowth: "#3D6B4A",
    amberSap: "#9B7A2A",
    driedBlood: "#8B3A3A",
    rustMist: "#5C2828",
    neonMoss: "#7FFF00",
  };

  it.each(Object.entries(expected))(
    "%s matches spec value %s",
    (key, hex) => {
      expect(colors[key as keyof typeof colors]).toBe(hex);
    }
  );

  it("has no extra or missing tokens vs spec", () => {
    expect(Object.keys(colors).sort()).toEqual(Object.keys(expected).sort());
  });
});
