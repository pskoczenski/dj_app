/**
 * Smoke tests: verify critical modules can be imported together
 * without circular dependency errors or missing exports.
 */

describe("Module smoke tests", () => {
  it("imports all service modules without circular dependency errors", () => {
    expect(() => {
      require("@/lib/services/profiles");
      require("@/lib/services/events");
      require("@/lib/services/event-lineup");
      require("@/lib/services/mixes");
      require("@/lib/services/follows");
      require("@/lib/services/search");
      require("@/lib/services/storage");
    }).not.toThrow();
  });

  it("imports all hook modules without errors", () => {
    expect(() => {
      require("@/hooks/use-debounce");
      require("@/hooks/use-current-user");
      require("@/hooks/use-profile");
      require("@/hooks/use-events");
      require("@/hooks/use-event");
      require("@/hooks/use-mixes");
    }).not.toThrow();
  });

  it("imports type re-exports without errors", () => {
    expect(() => {
      const types = require("@/types");
      expect(types).toBeDefined();
    }).not.toThrow();
  });

  it("imports utility modules without errors", () => {
    expect(() => {
      require("@/lib/utils");
      require("@/lib/utils/slug");
      require("@/lib/utils/embed");
      require("@/lib/design-tokens");
      require("@/lib/db/schema-constants");
    }).not.toThrow();
  });
});
