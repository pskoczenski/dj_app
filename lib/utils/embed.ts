import type { MixPlatform } from "@/types";

const ALLOWED_HOSTS: Record<string, MixPlatform> = {
  "www.youtube.com": "youtube",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "soundcloud.com": "soundcloud",
  "www.soundcloud.com": "soundcloud",
  "www.mixcloud.com": "mixcloud",
  "mixcloud.com": "mixcloud",
  "open.spotify.com": "spotify",
  "music.apple.com": "apple_music",
};

const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "soundcloud.com",
  "www.soundcloud.com",
  "www.mixcloud.com",
  "mixcloud.com",
  "open.spotify.com",
  "music.apple.com",
]);

export function isAllowedEmbedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return EMBED_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function getPlatformFromUrl(url: string): MixPlatform {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOSTS[host] ?? "other";
  } catch {
    return "other";
  }
}

export function getEmbedUrl(url: string, platform: MixPlatform): string | null {
  if (!isAllowedEmbedHost(url) && platform !== "other") return null;

  try {
    const parsed = new URL(url);

    switch (platform) {
      case "youtube": {
        // https://www.youtube.com/watch?v=ID → https://www.youtube.com/embed/ID
        // https://youtu.be/ID → https://www.youtube.com/embed/ID
        let videoId = parsed.searchParams.get("v");
        if (!videoId && parsed.hostname === "youtu.be") {
          videoId = parsed.pathname.slice(1);
        }
        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : null;
      }

      case "soundcloud":
        // SoundCloud oEmbed requires API call; for iframe embed, use the widget URL
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23404040&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;

      case "mixcloud":
        // https://www.mixcloud.com/USER/MIX/ → /widget/iframe/?feed=/USER/MIX/
        return `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(parsed.pathname)}&hide_cover=1&light=1`;

      case "spotify":
        // https://open.spotify.com/track/ID → https://open.spotify.com/embed/track/ID
        return url.replace("open.spotify.com/", "open.spotify.com/embed/");

      case "apple_music":
        // https://music.apple.com/us/album/... → https://embed.music.apple.com/us/album/...
        return url.replace("music.apple.com/", "embed.music.apple.com/");

      default:
        return null;
    }
  } catch {
    return null;
  }
}
