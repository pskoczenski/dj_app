/**
 * Smoke tests: verify critical modules can be imported together
 * without circular dependency errors or missing exports.
 */

describe("Module smoke tests", () => {
  it("imports all service modules without circular dependency errors", async () => {
    await expect(Promise.all([
      import("@/lib/services/profiles"),
      import("@/lib/services/events"),
      import("@/lib/services/event-lineup"),
      import("@/lib/services/mixes"),
      import("@/lib/services/follows"),
      import("@/lib/services/search"),
      import("@/lib/services/storage"),
    ])).resolves.toBeDefined();
  });

  it("imports all hook modules without errors", async () => {
    await expect(Promise.all([
      import("@/hooks/use-debounce"),
      import("@/hooks/use-current-user"),
      import("@/hooks/use-profile"),
      import("@/hooks/use-events"),
      import("@/hooks/use-event"),
      import("@/hooks/use-mixes"),
    ])).resolves.toBeDefined();
  });

  it("imports type re-exports without errors", async () => {
    const types = await import("@/types");
    expect(types).toBeDefined();
  });

  it("imports utility modules without errors", async () => {
    await expect(Promise.all([
      import("@/lib/utils"),
      import("@/lib/utils/slug"),
      import("@/lib/utils/embed"),
      import("@/lib/design-tokens"),
      import("@/lib/db/schema-constants"),
    ])).resolves.toBeDefined();
  });
});
