import {
  isAllowedEmbedHost,
  getPlatformFromUrl,
  getEmbedUrl,
} from "@/lib/utils/embed";

describe("isAllowedEmbedHost", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://soundcloud.com/artist/track",
    "https://www.mixcloud.com/dj/mix/",
    "https://open.spotify.com/track/123",
    "https://music.apple.com/us/album/xyz",
  ])("allows %s", (url) => {
    expect(isAllowedEmbedHost(url)).toBe(true);
  });

  it.each([
    "https://evil.com/iframe",
    "https://example.com",
    "javascript:alert(1)",
    "not-a-url",
    "",
  ])("rejects %s", (url) => {
    expect(isAllowedEmbedHost(url)).toBe(false);
  });
});

describe("getPlatformFromUrl", () => {
  it("detects YouTube", () => {
    expect(getPlatformFromUrl("https://www.youtube.com/watch?v=abc")).toBe("youtube");
    expect(getPlatformFromUrl("https://youtu.be/abc")).toBe("youtube");
  });

  it("detects SoundCloud", () => {
    expect(getPlatformFromUrl("https://soundcloud.com/a/b")).toBe("soundcloud");
  });

  it("detects Mixcloud", () => {
    expect(getPlatformFromUrl("https://www.mixcloud.com/dj/mix/")).toBe("mixcloud");
  });

  it("detects Spotify", () => {
    expect(getPlatformFromUrl("https://open.spotify.com/track/123")).toBe("spotify");
  });

  it("detects Apple Music", () => {
    expect(getPlatformFromUrl("https://music.apple.com/us/album/xyz")).toBe("apple_music");
  });

  it("returns other for unknown URLs", () => {
    expect(getPlatformFromUrl("https://example.com")).toBe("other");
  });

  it("returns other for invalid URLs", () => {
    expect(getPlatformFromUrl("not-a-url")).toBe("other");
  });
});

describe("getEmbedUrl", () => {
  it("transforms YouTube watch URL to embed", () => {
    const result = getEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube");
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("transforms YouTube short URL to embed", () => {
    const result = getEmbedUrl("https://youtu.be/dQw4w9WgXcQ", "youtube");
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("generates SoundCloud widget URL", () => {
    const result = getEmbedUrl("https://soundcloud.com/artist/track", "soundcloud");
    expect(result).toContain("w.soundcloud.com/player");
    expect(result).toContain(encodeURIComponent("https://soundcloud.com/artist/track"));
  });

  it("generates Mixcloud widget URL", () => {
    const result = getEmbedUrl("https://www.mixcloud.com/dj/mix/", "mixcloud");
    expect(result).toContain("mixcloud.com/widget/iframe");
  });

  it("transforms Spotify URL to embed", () => {
    const result = getEmbedUrl("https://open.spotify.com/track/123", "spotify");
    expect(result).toBe("https://open.spotify.com/embed/track/123");
  });

  it("transforms Apple Music URL to embed", () => {
    const result = getEmbedUrl("https://music.apple.com/us/album/xyz", "apple_music");
    expect(result).toBe("https://embed.music.apple.com/us/album/xyz");
  });

  it("returns null for disallowed host on non-other platform", () => {
    const result = getEmbedUrl("https://evil.com/bad", "youtube");
    expect(result).toBeNull();
  });

  it("returns null for other platform", () => {
    const result = getEmbedUrl("https://example.com/mix", "other");
    expect(result).toBeNull();
  });
});
