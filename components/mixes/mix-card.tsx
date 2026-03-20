"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MixEmbed } from "@/components/mixes/mix-embed";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Mix } from "@/types";

interface MixCardProps {
  mix: Mix;
  expanded: boolean;
  onToggle: () => void;
}

function platformLabel(platform: string): string {
  switch (platform) {
    case "apple_music":
      return "Apple Music";
    case "soundcloud":
      return "SoundCloud";
    case "mixcloud":
      return "Mixcloud";
    case "youtube":
      return "YouTube";
    case "spotify":
      return "Spotify";
    default:
      return "Link";
  }
}

export function MixCard({ mix, expanded, onToggle }: MixCardProps) {
  return (
    <Card className="transition-colors hover:ring-sage-edge">
      {mix.cover_image_url && !expanded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mix.cover_image_url}
          alt={mix.title}
          className="aspect-[2/1] w-full object-cover"
        />
      )}
      <CardHeader>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between text-left"
        >
          <CardTitle className="text-bone">{mix.title}</CardTitle>
          {expanded ? (
            <ChevronUp className="size-4 shrink-0 text-fog" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-fog" />
          )}
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {platformLabel(mix.platform)}
          </Badge>
          {mix.duration && (
            <span className="text-xs text-fog">{mix.duration}</span>
          )}
        </div>
        {mix.genres && mix.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mix.genres.map((g) => (
              <Badge key={g} variant="secondary" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
        )}
        {expanded && (
          <div className="mt-2">
            <MixEmbed
              url={mix.embed_url}
              platform={mix.platform}
              title={mix.title}
            />
            {mix.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone">
                {mix.description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
