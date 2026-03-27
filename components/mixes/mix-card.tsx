"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MixEmbed } from "@/components/mixes/mix-embed";
import { CommentCountModalTrigger } from "@/components/comments/comment-count-modal-trigger";
import { mixLikesService } from "@/lib/services/mix-likes";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
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
  /** Whether the signed-in user has liked this mix (from batched query). */
  likedByMe?: boolean;
  currentUserId?: string | null;
  /** Called after a successful like/unlike so parents can sync `likes_count` and UI. */
  onLikeChange?: (next: { liked: boolean; likesCount: number }) => void;
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
  likedByMe = false,
  currentUserId = null,
  onLikeChange,
  manageMode = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  disableMoveUp = false,
  disableMoveDown = false,
}: MixCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const creatorName = mix.creator?.display_name?.trim();
  const creatorSlug = mix.creator?.slug?.trim();
  const addedLabel = formatMixAddedDate(mix.created_at);

  const [liked, setLiked] = useState(likedByMe);
  const [likesCount, setLikesCount] = useState(mix.likes_count ?? 0);
  const [likePending, setLikePending] = useState(false);

  useEffect(() => {
    setLiked(likedByMe);
  }, [likedByMe, mix.id]);

  useEffect(() => {
    setLikesCount(mix.likes_count ?? 0);
  }, [mix.likes_count, mix.id]);

  async function handleLikeClick() {
    if (!currentUserId) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const wasLiked = liked;
    const prevCount = likesCount;
    setLikePending(true);
    setLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const next = await mixLikesService.toggleLike(mix.id, currentUserId);
      setLiked(next.liked);
      setLikesCount(next.likesCount);
      onLikeChange?.(next);
    } catch {
      setLiked(wasLiked);
      setLikesCount(prevCount);
      toast.error("Couldn’t update like. Try again.");
    } finally {
      setLikePending(false);
    }
  }

  return (
    <Card
      size="sm"
      className="relative transition-colors hover:ring-sage-edge"
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
      <CardContent className="flex flex-col gap-1.5 pb-9 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              {platformLabel(mix.platform)}
            </Badge>
            {mix.duration && (
              <span className="text-xs text-fog">{mix.duration}</span>
            )}
          </div>
          <CommentCountModalTrigger
            commentableType="mix"
            commentableId={mix.id}
            title={mix.title}
            variant="badge"
            className="shrink-0"
            stopPropagation
          />
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

      <div className="pointer-events-none absolute bottom-2 right-2 md:right-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void handleLikeClick();
          }}
          disabled={likePending}
          aria-pressed={liked}
          aria-label={liked ? "Unlike this mix" : "Like this mix"}
          className="pointer-events-auto flex items-center gap-1 rounded-default px-1.5 py-1 text-fog transition-colors hover:bg-forest-shadow/80 hover:text-bone disabled:opacity-50"
        >
          <Heart
            className={cn(
              "size-4 shrink-0 transition-colors",
              liked
                ? "fill-neon-moss text-neon-moss"
                : "fill-transparent text-fog",
            )}
            strokeWidth={liked ? 0 : 2}
            aria-hidden
          />
          <span className="min-w-[1.25rem] text-right text-xs tabular-nums text-bone">
            {likesCount}
          </span>
        </button>
      </div>
    </Card>
  );
}
