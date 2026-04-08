"use client";

import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentCountModalTrigger } from "@/components/comments/comment-count-modal-trigger";
import { EventLikeControl } from "@/components/events/event-like-control";
import { EventSaveControl } from "@/components/events/event-save-control";
import { formatSetTime12h } from "@/lib/format-time";
import { formatAdmissionCompact } from "@/lib/utils/format-admission";
import type { Admission, EventWithLineupPreview } from "@/types";

function lineupDisplayNames(event: EventWithLineupPreview): string[] {
  const rows = event.event_lineup;
  if (!rows?.length) return [];
  return [...rows]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => r.profile?.display_name)
    .filter((n): n is string => Boolean(n));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventDateTimeLine(event: EventWithLineupPreview): string {
  const datePart = formatDate(event.start_date);
  const start = event.start_time ? formatSetTime12h(event.start_time) : null;
  const end = event.end_time ? formatSetTime12h(event.end_time) : null;
  if (start && end) return `${datePart} · ${start} – ${end}`;
  if (start) return `${datePart} · ${start}`;
  if (end) return `${datePart} · ${end}`;
  return datePart;
}

function statusVariant(status: string) {
  switch (status) {
    case "cancelled":
      return "cancelled" as const;
    case "draft":
      return "draft" as const;
    default:
      return "published" as const;
  }
}

export function EventCard({
  event,
  likedByMe = false,
  savedByMe = false,
  currentUserId = null,
  onLikeChange,
  onSaveChange,
}: {
  event: EventWithLineupPreview;
  likedByMe?: boolean;
  savedByMe?: boolean;
  currentUserId?: string | null;
  onLikeChange?: (next: { liked: boolean; likesCount: number }) => void;
  onSaveChange?: (next: { saved: boolean; savesCount: number }) => void;
}) {
  const location = [
    event.venue,
    event.street_address,
    event.cities?.name,
    event.cities?.state_code,
  ]
    .filter(Boolean)
    .join(", ");
  const headingId = `event-title-${event.id}`;
  const djNames = lineupDisplayNames(event);
  const dateTimeLine = formatEventDateTimeLine(event);

  // Keep row heights consistent: show max 2 genre tags + a compact "+N" overflow.
  const visibleTags = event.genres?.slice(0, 2) ?? [];
  const extraTagsCount = Math.max(0, (event.genres?.length ?? 0) - visibleTags.length);

  // Descriptive label for the single focusable link (helps grid navigation via keyboard/screen readers).
  const ariaLabel = [event.title, dateTimeLine, location || null]
    .filter(Boolean)
    .join(", ");

  return (
    <article aria-labelledby={headingId} className="h-full">
      <Card
        variant="interactive"
        // Subtle polish: clearer hover edge without changing proportions.
        className="relative flex h-full min-h-96 flex-col gap-0 py-0 hover:ring-1 hover:ring-mb-turquoise-mid/25"
      >
        <Link
          href={`/events/${event.id}`}
          aria-label={ariaLabel}
          className="flex min-h-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2"
        >
          <div className="relative">
            {event.flyer_image_url ? (
              <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden">
                {/* Blur fill — scale-110 hides the soft edge that blur-xl produces */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.flyer_image_url}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.flyer_image_url}
                  alt={event.title}
                  className="relative z-10 h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-[2/1] w-full shrink-0 bg-mb-surface-3" aria-hidden />
            )}
            {/* Soft image→surface transition (subtle, keeps the artwork-forward feel). */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-mb-surface-2/70 to-transparent"
              aria-hidden
            />
          </div>

          <CardHeader className="pb-0 pt-3">
            {/* Clamp + reserve height so metadata aligns across a row. */}
            <CardTitle
              id={headingId}
              className="line-clamp-2 min-h-[2.75rem] text-[18px] leading-snug font-semibold text-mb-text-primary"
            >
              {event.title}
            </CardTitle>
            {/* Subtitle: tighter, muted, and visually anchored under the title. */}
            {djNames.length > 0 && (
              <p className="text-[13px] leading-snug text-mb-text-secondary">
                {djNames.join(" · ")}
              </p>
            )}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col py-0">
            {/* Metadata group: consistent internal spacing (no “floating fragments”). */}
            <div className="mt-3 space-y-1.5 text-[13px] leading-snug text-mb-text-secondary">
              <div className="flex items-start gap-2">
                <Calendar className="mt-[2px] size-4 shrink-0 text-mb-text-tertiary" />
                <span>{dateTimeLine}</span>
              </div>
              {location ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-[2px] size-4 shrink-0 text-mb-text-tertiary" />
                  <span className="line-clamp-2">{location}</span>
                </div>
              ) : null}
              {(() => {
                const admStr = formatAdmissionCompact(event.admission as Admission | null);
                const parts = [admStr, event.is_ticketed ? "Ticketed" : null].filter(Boolean);
                if (!parts.length) return null;
                return (
                  <div className="flex items-center gap-1.5 text-[13px] text-mb-text-secondary">
                    <Ticket className="size-4 shrink-0 text-mb-text-tertiary" />
                    <span>{parts.join(" · ")}</span>
                  </div>
                );
              })()}
            </div>

            {/* Tags: capped for consistent height. */}
            {event.genres && event.genres.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {visibleTags.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="h-auto min-h-0 rounded-full border-mb-border-soft bg-transparent px-2.5 py-1 text-[11px] font-medium text-mb-text-tertiary"
                  >
                    {g}
                  </Badge>
                ))}
                {extraTagsCount > 0 ? (
                  <Badge
                    variant="outline"
                    className="h-auto min-h-0 rounded-full border-mb-border-soft bg-transparent px-2.5 py-1 text-[11px] font-medium text-mb-text-tertiary"
                  >
                    +{extraTagsCount}
                  </Badge>
                ) : null}
              </div>
            ) : (
              <div className="mt-4" />
            )}

            {/* Spacer keeps the bottom row aligned across a grid. */}
            <div className="flex-1" />

            {event.status !== "published" && (
              <Badge variant={statusVariant(event.status)} className="mt-3 w-fit">
                {event.status}
              </Badge>
            )}

            {/* Lightweight metrics: no divider strip, muted + compact. */}
            <div className="mt-3 flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-1">
                <EventLikeControl
                  eventId={event.id}
                  likesCount={event.likes_count ?? 0}
                  likedByMe={likedByMe}
                  currentUserId={currentUserId}
                  onLikeChange={onLikeChange}
                  variant="inline"
                  className="text-mb-text-tertiary hover:bg-mb-surface-3 hover:text-mb-text-primary"
                />
                <EventSaveControl
                  eventId={event.id}
                  savesCount={event.saves_count ?? 0}
                  savedByMe={savedByMe}
                  currentUserId={currentUserId}
                  onSaveChange={onSaveChange}
                  variant="inline"
                  className="text-mb-text-tertiary hover:bg-mb-surface-3 hover:text-mb-text-primary"
                />
              </div>
              <CommentCountModalTrigger
                commentableType="event"
                commentableId={event.id}
                title={event.title}
                variant="badge"
                className="text-mb-text-tertiary hover:bg-mb-surface-3 hover:text-mb-text-primary"
              />
            </div>
          </CardContent>
        </Link>
      </Card>
    </article>
  );
}
