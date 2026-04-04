import { formatSetTimeForInput } from "@/lib/utils/format-set-time-for-input";

describe("formatSetTimeForInput", () => {
  it("returns empty for nullish", () => {
    expect(formatSetTimeForInput(null)).toBe("");
    expect(formatSetTimeForInput(undefined)).toBe("");
    expect(formatSetTimeForInput("")).toBe("");
  });

  it("truncates Postgres time to HH:MM", () => {
    expect(formatSetTimeForInput("22:00:00")).toBe("22:00");
  });
});
