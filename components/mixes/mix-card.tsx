"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MixEmbed } from "@/components/mixes/mix-embed";
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import type { MixWithCreator } from "@/types";

function formatMixAddedDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

interface MixCardProps {
  mix: MixWithCreator;
  expanded: boolean;
  onToggle: () => void;
  /** Owner-only toolbar: reorder, edit, delete */
  manageMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
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

export function MixCard({
  mix,
  expanded,
  onToggle,
  manageMode = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  disableMoveUp = false,
  disableMoveDown = false,
}: MixCardProps) {
  const creatorName = mix.creator?.display_name?.trim();
  const creatorSlug = mix.creator?.slug?.trim();
  const addedLabel = formatMixAddedDate(mix.created_at);

  return (
    <Card
      size="sm"
      className="transition-colors hover:ring-sage-edge"
    >
      <CardHeader className="pb-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-1.5">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              className="min-w-0 flex-1 text-left"
            >
              <CardTitle className="text-bone">{mix.title}</CardTitle>
            </button>
            <div className="flex shrink-0 items-start gap-0.5">
              {mix.cover_image_url && !expanded && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mix.cover_image_url}
                    alt={mix.title}
                    className="h-16 max-h-16 w-16 shrink-0 rounded-default object-cover"
                  />
              )}
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse mix" : "Expand mix"}
                className="rounded-default p-1 text-fog hover:bg-forest-shadow/80 hover:text-bone"
              >
                {expanded ? (
                  <ChevronUp className="size-4 shrink-0" />
                ) : (
                  <ChevronDown className="size-4 shrink-0" />
                )}
              </button>
              
            </div>
            {manageMode && (
              <div className="flex shrink-0 items-center gap-0.5 self-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move mix up"
                  disabled={disableMoveUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp?.();
                  }}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move mix down"
                  disabled={disableMoveDown}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown?.();
                  }}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Link
                  href={`/mixes/${mix.id}/edit`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon-sm",
                  })}
                  aria-label="Edit mix"
                >
                  <Pencil className="size-4" />
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-dried-blood hover:text-bone"
                  aria-label="Delete mix"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-1 text-xs text-stone">
            {creatorName ? (
              creatorSlug ? (
                <Link
                  href={`/dj/${creatorSlug}`}
                  className="font-medium text-fern hover:underline"
                >
                  {creatorName}
                </Link>
              ) : (
                <span className="font-medium text-bone">{creatorName}</span>
              )
            ) : null}
            {creatorName ? (
              <span className="text-fog" aria-hidden>
                ·
              </span>
            ) : null}
            <span className="text-fog">
              Added{" "}
              <time dateTime={mix.created_at ?? undefined}>{addedLabel}</time>
            </span>
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 pb-3 pt-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {platformLabel(mix.platform)}
          </Badge>
          {mix.duration && (
            <span className="text-xs text-fog">{mix.duration}</span>
          )}
        </div>
        {mix.genres && mix.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mix.genres.map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px] sm:text-xs">
                {g}
              </Badge>
            ))}
          </div>
        )}
        {expanded && (
          <div className="mt-1">
            <MixEmbed
              url={mix.embed_url}
              platform={mix.platform}
              title={mix.title}
            />
            {mix.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone">
                {mix.description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
