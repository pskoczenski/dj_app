import {
  getPlatformFromUrl,
  isAllowedEmbedHost,
} from "@/lib/utils/embed";
import type { MixPlatform } from "@/types";

export interface MixOembedMetadata {
  title: string | null;
  thumbnailUrl: string | null;
}

function oembedRequestUrl(pageUrl: string, platform: MixPlatform): string | null {
  const enc = encodeURIComponent(pageUrl);
  switch (platform) {
    case "youtube":
      return `https://www.youtube.com/oembed?format=json&url=${enc}`;
    case "soundcloud":
      return `https://soundcloud.com/oembed?format=json&url=${enc}`;
    case "mixcloud":
      return `https://www.mixcloud.com/oembed/?url=${enc}`;
    case "spotify":
      return `https://open.spotify.com/oembed?url=${enc}`;
    default:
      return null;
  }
}

function pickThumbnail(json: Record<string, unknown>): string | null {
  const thumb = json.thumbnail_url;
  if (typeof thumb === "string" && thumb.startsWith("http")) return thumb;
  const image = json.image;
  if (typeof image === "string" && image.startsWith("http")) return image;
  return null;
}

function pickTitle(json: Record<string, unknown>): string | null {
  const t = json.title;
  if (typeof t === "string") {
    const s = t.trim();
    return s.length > 0 ? s : null;
  }
  return null;
}

/** Fetches oEmbed metadata for supported mix hosts (server-side). */
export async function fetchMixOembedMetadata(
  pageUrl: string,
): Promise<MixOembedMetadata> {
  if (!isAllowedEmbedHost(pageUrl)) {
    return { title: null, thumbnailUrl: null };
  }
  const platform = getPlatformFromUrl(pageUrl);
  if (platform === "other") {
    return { title: null, thumbnailUrl: null };
  }
  const oembedUrl = oembedRequestUrl(pageUrl, platform);
  if (!oembedUrl) {
    return { title: null, thumbnailUrl: null };
  }

  try {
    const res = await fetch(oembedUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { title: null, thumbnailUrl: null };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return {
      title: pickTitle(json),
      thumbnailUrl: pickThumbnail(json),
    };
  } catch {
    return { title: null, thumbnailUrl: null };
  }
}
