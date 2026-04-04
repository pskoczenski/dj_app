import {
  formatSetTime12h,
  formatSetTimeForLineupField,
  parseLineupSetTimeToPostgres,
} from "@/lib/format-time";

describe("formatSetTime12h", () => {
  it("formats 24h morning and evening", () => {
    expect(formatSetTime12h("09:05:00")).toBe("9:05 AM");
    expect(formatSetTime12h("22:30:00")).toBe("10:30 PM");
    expect(formatSetTime12h("00:00:00")).toBe("12:00 AM");
    expect(formatSetTime12h("12:00:00")).toBe("12:00 PM");
  });
});

describe("formatSetTimeForLineupField", () => {
  it("returns empty for nullish", () => {
    expect(formatSetTimeForLineupField(null)).toBe("");
    expect(formatSetTimeForLineupField(undefined)).toBe("");
    expect(formatSetTimeForLineupField("")).toBe("");
  });

  it("delegates to 12h display for DB times", () => {
    expect(formatSetTimeForLineupField("22:00:00")).toBe("10:00 PM");
  });
});

describe("parseLineupSetTimeToPostgres", () => {
  it("returns null for empty", () => {
    expect(parseLineupSetTimeToPostgres("")).toBeNull();
    expect(parseLineupSetTimeToPostgres("   ")).toBeNull();
  });

  it("parses 12-hour with minutes", () => {
    expect(parseLineupSetTimeToPostgres("10:30 PM")).toBe("22:30:00");
    expect(parseLineupSetTimeToPostgres("10:30 pm")).toBe("22:30:00");
    expect(parseLineupSetTimeToPostgres("12:00 AM")).toBe("00:00:00");
    expect(parseLineupSetTimeToPostgres("12:15 PM")).toBe("12:15:00");
    expect(parseLineupSetTimeToPostgres("1:05 AM")).toBe("01:05:00");
  });

  it("parses 12-hour hour-only", () => {
    expect(parseLineupSetTimeToPostgres("10 PM")).toBe("22:00:00");
    expect(parseLineupSetTimeToPostgres("12 am")).toBe("00:00:00");
  });

  it("parses 24-hour", () => {
    expect(parseLineupSetTimeToPostgres("22:30")).toBe("22:30:00");
    expect(parseLineupSetTimeToPostgres("09:05:00")).toBe("09:05:00");
  });

  it("returns null for invalid", () => {
    expect(parseLineupSetTimeToPostgres("25:00")).toBeNull();
    expect(parseLineupSetTimeToPostgres("13:00 PM")).toBeNull();
    expect(parseLineupSetTimeToPostgres("nope")).toBeNull();
  });
});
