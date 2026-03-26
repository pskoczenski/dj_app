describe("fetchMixOembedMetadata", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
  });

  it("returns nulls for disallowed hosts without calling fetch", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const { fetchMixOembedMetadata } = await import("@/lib/mix-oembed");
    const meta = await fetchMixOembedMetadata("https://evil.example/mix");
    expect(meta).toEqual({ title: null, thumbnailUrl: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses YouTube oEmbed JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "  Night Session ",
        thumbnail_url: "https://i.ytimg.com/vi/abc/hqdefault.jpg",
      }),
    }) as unknown as typeof fetch;

    const { fetchMixOembedMetadata } = await import("@/lib/mix-oembed");
    const meta = await fetchMixOembedMetadata(
      "https://www.youtube.com/watch?v=abc",
    );
    expect(meta.title).toBe("Night Session");
    expect(meta.thumbnailUrl).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("youtube.com/oembed"),
      expect.any(Object),
    );
  });

  it("uses image when thumbnail_url is missing (e.g. Mixcloud)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Cloud Mix",
        image: "https://cdn.example/cover.png",
      }),
    }) as unknown as typeof fetch;

    const { fetchMixOembedMetadata } = await import("@/lib/mix-oembed");
    const meta = await fetchMixOembedMetadata(
      "https://www.mixcloud.com/dj/sets/mix/",
    );
    expect(meta.title).toBe("Cloud Mix");
    expect(meta.thumbnailUrl).toBe("https://cdn.example/cover.png");
  });
});
