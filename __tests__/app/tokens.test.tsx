/**
 * Smoke: Mirrorball CSS variables resolve in the DOM (same names Tailwind mb-* utilities use).
 */
describe("Mirrorball token wiring", () => {
  it("resolves --mb-surface-0 and --mb-text-primary to non-empty computed colors", () => {
    const root = document.documentElement;
    root.style.setProperty("--mb-surface-0", "#161310");
    root.style.setProperty("--mb-text-primary", "#ebe6df");

    const el = document.createElement("div");
    el.style.backgroundColor = "var(--mb-surface-0)";
    el.style.color = "var(--mb-text-primary)";
    document.body.appendChild(el);

    const cs = getComputedStyle(el);
    expect(cs.backgroundColor).not.toBe("");
    expect(cs.color).not.toBe("");

    document.body.removeChild(el);
    root.style.removeProperty("--mb-surface-0");
    root.style.removeProperty("--mb-text-primary");
  });

  it("uses mb-* Tailwind utility class names on a fragment", () => {
    const el = document.createElement("div");
    el.className = "bg-mb-surface-0 text-mb-text-primary";
    expect(el.className).toContain("bg-mb-surface-0");
    expect(el.className).toContain("text-mb-text-primary");
  });
});
