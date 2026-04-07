import { mirrorballColors } from "@/lib/design-tokens";

describe("Design tokens — Mirrorball palette", () => {
  const expected: Record<string, string> = {
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
  };

  it.each(Object.entries(expected))(
    "%s matches spec value %s",
    (key, hex) => {
      expect(mirrorballColors[key as keyof typeof mirrorballColors]).toBe(hex);
    },
  );

  it("has no extra or missing tokens vs spec", () => {
    expect(Object.keys(mirrorballColors).sort()).toEqual(
      Object.keys(expected).sort(),
    );
  });
});
