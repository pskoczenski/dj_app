describe("getSupabaseEnv", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  async function loadEnv() {
    const mod = await import("@/lib/supabase/env");
    return mod.getSupabaseEnv;
  }

  it("returns url and anonKey when both vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const getSupabaseEnv = await loadEnv();
    const result = getSupabaseEnv();

    expect(result).toEqual({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
  });

  it("trims whitespace around env values", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://example.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  test-anon-key  ";

    const getSupabaseEnv = await loadEnv();
    const result = getSupabaseEnv();

    expect(result).toEqual({
      url: "https://example.supabase.co",
      anonKey: "test-anon-key",
    });
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const getSupabaseEnv = await loadEnv();
    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when no publishable/anon key is set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    const getSupabaseEnv = await loadEnv();
    expect(() => getSupabaseEnv()).toThrow(/publishable key/);
  });

  it("prefers PUBLISHABLE_KEY over ANON_KEY when both set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_new";

    const getSupabaseEnv = await loadEnv();
    const result = getSupabaseEnv();

    expect(result.anonKey).toBe("sb_publishable_new");
  });
});
