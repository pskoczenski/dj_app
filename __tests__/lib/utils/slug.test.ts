import { slugify } from "@/lib/utils/slug";

// Mock createClient at the module level so generateUniqueSlug can use it
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("DJ Shadow")).toBe("dj-shadow");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Cool DJ (Berlin)")).toBe("cool-dj-berlin");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a---b")).toBe("a-b");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --hello-- ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("generateUniqueSlug", () => {
  beforeEach(() => jest.clearAllMocks());

  async function loadGenerate() {
    const mod = await import("@/lib/utils/slug");
    return mod.generateUniqueSlug;
  }

  it("returns the base slug when it is available", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null });

    const generateUniqueSlug = await loadGenerate();
    const slug = await generateUniqueSlug("DJ Shadow");

    expect(slug).toBe("dj-shadow");
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });

  it("appends a counter when the base slug is taken", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { id: "exists" } }) // "dj-shadow" taken
      .mockResolvedValueOnce({ data: null }); // "dj-shadow-1" free

    const generateUniqueSlug = await loadGenerate();
    const slug = await generateUniqueSlug("DJ Shadow");

    expect(slug).toBe("dj-shadow-1");
  });

  it("increments until a free slug is found", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { id: "exists" } }) // base taken
      .mockResolvedValueOnce({ data: { id: "exists" } }) // -1 taken
      .mockResolvedValueOnce({ data: null }); // -2 free

    const generateUniqueSlug = await loadGenerate();
    const slug = await generateUniqueSlug("DJ Shadow");

    expect(slug).toBe("dj-shadow-2");
  });

  it("falls back to user-<timestamp> for empty display names", async () => {
    const generateUniqueSlug = await loadGenerate();
    const slug = await generateUniqueSlug("");

    expect(slug).toMatch(/^user-\d+$/);
  });
});
