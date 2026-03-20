"use client";

import { getEmbedUrl } from "@/lib/utils/embed";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { MixPlatform } from "@/types";

interface MixEmbedProps {
  url: string;
  platform: MixPlatform;
  title: string;
}

const IFRAME_HEIGHTS: Partial<Record<MixPlatform, number>> = {
  youtube: 315,
  soundcloud: 166,
  mixcloud: 120,
  spotify: 152,
  apple_music: 175,
};

export function MixEmbed({ url, platform, title }: MixEmbedProps) {
  if (platform === "other") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="w-full">
          <ExternalLink className="mr-1.5 size-4" />
          Open &ldquo;{title}&rdquo; in new tab
        </Button>
      </a>
    );
  }

  const embedUrl = getEmbedUrl(url, platform);

  if (!embedUrl) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="w-full">
          <ExternalLink className="mr-1.5 size-4" />
          Open &ldquo;{title}&rdquo; in new tab
        </Button>
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-default">
      <iframe
        src={embedUrl}
        title={title}
        width="100%"
        height={IFRAME_HEIGHTS[platform] ?? 200}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="border-0"
      />
    </div>
  );
}
