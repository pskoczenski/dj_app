import {
  formatAdmissionCompact,
  formatAdmissionDetail,
} from "@/lib/utils/format-admission";
import type { Admission } from "@/types";

describe("formatAdmissionCompact", () => {
  it("returns null for null input", () => {
    expect(formatAdmissionCompact(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(formatAdmissionCompact(undefined)).toBeNull();
  });

  it("returns Free for free type", () => {
    expect(formatAdmissionCompact({ type: "free" })).toBe("Free");
  });

  it("formats whole-number fixed price without decimals", () => {
    expect(formatAdmissionCompact({ type: "fixed", amount: 20 })).toBe("$20");
  });

  it("formats fractional fixed price with two decimals", () => {
    expect(formatAdmissionCompact({ type: "fixed", amount: 12.5 })).toBe("$12.50");
  });

  it("formats sliding scale as min–max", () => {
    expect(
      formatAdmissionCompact({ type: "sliding_scale", min: 10, max: 25 }),
    ).toBe("$10–$25");
  });

  it("returns null for tiered with no tiers", () => {
    expect(formatAdmissionCompact({ type: "tiered", tiers: [] })).toBeNull();
  });

  it("shows single amount for tiered with one tier", () => {
    expect(
      formatAdmissionCompact({
        type: "tiered",
        tiers: [{ label: "GA", amount: 25 }],
      }),
    ).toBe("$25");
  });

  it("abbreviates labels for tiered with two tiers", () => {
    expect(
      formatAdmissionCompact({
        type: "tiered",
        tiers: [
          { label: "Advance", amount: 15 },
          { label: "Door", amount: 20 },
        ],
      }),
    ).toBe("$15 adv / $20 door");
  });

  it("shows amounts without labels when labels are empty", () => {
    expect(
      formatAdmissionCompact({
        type: "tiered",
        tiers: [
          { label: "", amount: 15 },
          { label: "", amount: 20 },
        ],
      }),
    ).toBe("$15 / $20");
  });

  it("only uses first two tiers for compact format", () => {
    const result = formatAdmissionCompact({
      type: "tiered",
      tiers: [
        { label: "Early bird", amount: 10 },
        { label: "Advance", amount: 15 },
        { label: "Door", amount: 20 },
      ],
    });
    expect(result).not.toContain("$20");
  });
});

describe("formatAdmissionDetail", () => {
  it("returns empty array for null", () => {
    expect(formatAdmissionDetail(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(formatAdmissionDetail(undefined)).toEqual([]);
  });

  it("returns ['Free'] for free type", () => {
    expect(formatAdmissionDetail({ type: "free" })).toEqual(["Free"]);
  });

  it("returns single-element array for fixed", () => {
    expect(formatAdmissionDetail({ type: "fixed", amount: 20 })).toEqual(["$20"]);
  });

  it("returns single-element array for sliding scale", () => {
    expect(
      formatAdmissionDetail({ type: "sliding_scale", min: 10, max: 25 }),
    ).toEqual(["$10–$25"]);
  });

  it("returns one line per tier for tiered with until", () => {
    const result = formatAdmissionDetail({
      type: "tiered",
      tiers: [
        { label: "Advance", amount: 15, until: "before 10pm" },
        { label: "Door", amount: 20 },
      ],
    } as Admission);
    expect(result).toEqual([
      "$15 Advance (before 10pm)",
      "$20 Door",
    ]);
  });

  it("omits until when not set", () => {
    const result = formatAdmissionDetail({
      type: "tiered",
      tiers: [{ label: "GA", amount: 25 }],
    });
    expect(result).toEqual(["$25 GA"]);
  });

  it("handles tier with empty label", () => {
    const result = formatAdmissionDetail({
      type: "tiered",
      tiers: [{ label: "", amount: 30 }],
    });
    expect(result).toEqual(["$30"]);
  });
});
