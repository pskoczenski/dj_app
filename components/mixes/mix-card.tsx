"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MixEmbed } from "@/components/mixes/mix-embed";
import { CommentCountModalTrigger } from "@/components/comments/comment-count-modal-trigger";
import { mixLikesService } from "@/lib/services/mix-likes";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Heart,
  MoreHorizontal,
  Music,
  Pencil,
  Trash2,
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
  likedByMe?: boolean;
  currentUserId?: string | null;
  onLikeChange?: (next: { liked: boolean; likesCount: number }) => void;
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

const manageMenuVisibility = cn(
  "transition-opacity duration-200 ease-out",
  "max-sm:opacity-100",
  "[@media(pointer:coarse)]:opacity-100",
  "[@media(hover:hover)_and_(pointer:fine)_and_(min-width:640px)]:opacity-0",
  "[@media(hover:hover)_and_(pointer:fine)_and_(min-width:640px)]:group-hover/mix-card:opacity-100",
);

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

  async function handleLikeClick(e: React.MouseEvent) {
    e.stopPropagation();
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

  function handleCardActivate() {
    onToggle();
  }

  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      const t = e.target as HTMLElement;
      if (t.closest("[data-mix-card-stop-nav]")) return;
      e.preventDefault();
      handleCardActivate();
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("[data-mix-card-stop-nav]")) return;
    handleCardActivate();
  }

  function handleExpandToggle(e: React.MouseEvent) {
    e.stopPropagation();
    onToggle();
  }

  return (
    <article
      tabIndex={0}
      aria-label={
        expanded
          ? `${mix.title}, player expanded. Press Enter or Space to collapse.`
          : `${mix.title}, collapsed. Press Enter or Space to expand player.`
      }
      data-expanded={expanded ? "true" : "false"}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group/mix-card relative rounded-[14px] border border-mb-border-hair bg-mb-surface-2 p-4 shadow-sm md:p-5",
        "cursor-pointer transition-colors duration-200 ease-out",
        "hover:border-mb-border-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-1",
      )}
    >
      <div className="relative flex gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div
            className={cn(
              "relative overflow-hidden rounded-[10px] shadow-md ring-1 ring-mb-border-hair ring-inset",
              "size-20 sm:size-24 md:size-28",
            )}
          >
            {mix.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mix.cover_image_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center bg-mb-surface-3 text-mb-text-tertiary"
                aria-hidden
              >
                <Music className="size-8 sm:size-9" />
              </div>
            )}
          </div>
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 pr-[3.25rem] sm:pr-14">
          <div className="min-w-0 space-y-2">
            <h2 className="font-display text-lg font-semibold leading-snug tracking-tight text-mb-text-primary md:text-xl">
              {mix.title}
            </h2>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] leading-snug text-mb-text-secondary md:text-sm">
              {creatorName ? (
                creatorSlug ? (
                  <Link
                    href={`/dj/${creatorSlug}`}
                    data-mix-card-stop-nav
                    className="font-medium text-mb-turquoise-pale hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {creatorName}
                  </Link>
                ) : (
                  <span className="font-medium text-mb-text-primary">
                    {creatorName}
                  </span>
                )
              ) : null}
              {creatorName ? (
                <span className="text-mb-text-tertiary" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className="text-mb-text-tertiary">
                {platformLabel(mix.platform)}
              </span>
              <span className="text-mb-text-tertiary" aria-hidden>
                ·
              </span>
              <span className="text-mb-text-tertiary">
                Added{" "}
                <time dateTime={mix.created_at ?? undefined}>{addedLabel}</time>
              </span>
            </p>
          </div>

          {mix.genres && mix.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {mix.genres.map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className="h-auto min-h-0 rounded-full border-mb-border-soft bg-transparent px-3 py-1 text-[11px] font-medium text-mb-text-tertiary md:text-xs"
                >
                  {g}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-end gap-4 pt-2">
            <div
              className="flex items-center gap-4 text-[13px] tabular-nums text-mb-text-tertiary"
              data-mix-card-stop-nav
            >
              <button
                type="button"
                aria-pressed={liked}
                aria-label={liked ? "Unlike this mix" : "Like this mix"}
                disabled={likePending}
                onClick={handleLikeClick}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors",
                  "hover:text-mb-text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2",
                  "disabled:opacity-50",
                )}
              >
                <Heart
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    liked
                      ? "fill-mb-turquoise-pale text-mb-turquoise-pale"
                      : "fill-transparent text-mb-text-tertiary",
                  )}
                  strokeWidth={liked ? 0 : 2}
                  aria-hidden
                />
                <span className="text-mb-text-secondary">{likesCount}</span>
              </button>
              <CommentCountModalTrigger
                commentableType="mix"
                commentableId={mix.id}
                title={mix.title}
                variant="badge"
                stopPropagation
                className="inline-flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-[13px] text-mb-text-tertiary hover:bg-transparent hover:text-mb-text-primary"
              />
            </div>
          </div>
        </div>

        {/* Expand chevron + optional manage menu */}
        <div
          className="absolute right-0 top-0 z-10 flex flex-col items-end gap-1.5"
          data-mix-card-stop-nav
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse player" : "Expand player"}
            onClick={handleExpandToggle}
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
              "border border-mb-border-soft bg-mb-surface-3 text-mb-text-primary shadow-sm",
              "hover:border-mb-turquoise-mid/50 hover:bg-mb-surface-4 hover:text-mb-turquoise-pale",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2",
            )}
          >
            {expanded ? (
              <ChevronUp className="size-6" strokeWidth={2.25} aria-hidden />
            ) : (
              <ChevronDown className="size-6" strokeWidth={2.25} aria-hidden />
            )}
          </button>

          {manageMode ? (
            <div className={cn(manageMenuVisibility)}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  aria-label="Manage mix"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-lg",
                    "text-mb-text-tertiary hover:bg-mb-surface-3 hover:text-mb-text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2",
                  )}
                >
                  <MoreHorizontal className="size-5" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="min-w-44"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/mixes/${mix.id}/edit`);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={disableMoveUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp?.();
                    }}
                    className="gap-2"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                    Move up
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={disableMoveDown}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown?.();
                    }}
                    className="gap-2"
                  >
                    <ArrowDown className="size-4" aria-hidden />
                    Move down
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <section
          aria-label="Inline mix player"
          className="relative mt-4 border-t border-mb-border-hair pt-4"
          data-mix-card-stop-nav
          onClick={(e) => e.stopPropagation()}
        >
          <MixEmbed
            url={mix.embed_url}
            platform={mix.platform}
            title={mix.title}
          />
          {mix.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-mb-text-secondary">
              {mix.description}
            </p>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
