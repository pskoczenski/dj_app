import { getFtueSteps } from "@/lib/onboarding/ftue-steps";

describe("getFtueSteps", () => {
  it("returns 8 steps for mobile and desktop", () => {
    expect(getFtueSteps(true)).toHaveLength(8);
    expect(getFtueSteps(false)).toHaveLength(8);
  });

  it("uses quick-create on mobile and create heading on desktop for create step", () => {
    const mobile = getFtueSteps(true);
    const desktop = getFtueSteps(false);

    const mCreate = mobile.find((s) => s.anchor === "ftue-quick-create");
    const dCreate = desktop.find((s) => s.anchor === "ftue-create-heading");

    expect(mCreate?.path).toBe("/home");
    expect(dCreate?.path).toBe("/events/create");
  });
});
