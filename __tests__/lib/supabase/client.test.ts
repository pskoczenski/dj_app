describe("lib/supabase/client — createClient", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-123",
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("calls createBrowserClient with env url and anon key", async () => {
    const mockCreate = jest.fn(() => "mock-client");

    jest.doMock("@supabase/ssr", () => ({
      createBrowserClient: mockCreate,
    }));

    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();

    expect(mockCreate).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key-123"
    );
    expect(client).toBe("mock-client");
  });
});
