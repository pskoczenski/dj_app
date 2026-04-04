"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CornerVineAccent } from "@/components/decorative/corner-vine-accent";
import { CommentCountModalTrigger } from "@/components/comments/comment-count-modal-trigger";
import { EventLikeControl } from "@/components/events/event-like-control";
import { formatSetTime12h } from "@/lib/format-time";
import type { EventWithLineupPreview } from "@/types";

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
  currentUserId = null,
  onLikeChange,
}: {
  event: EventWithLineupPreview;
  likedByMe?: boolean;
  currentUserId?: string | null;
  onLikeChange?: (next: { liked: boolean; likesCount: number }) => void;
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

  return (
    <article aria-labelledby={headingId} className="h-full">
      <Card
        variant="interactive"
        className="relative flex min-h-96 h-full flex-col gap-0 py-0"
      >
        <Link
          href={`/events/${event.id}`}
          className="flex min-h-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-moss/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-moss"
        >
          <CornerVineAccent
            corner="top-right"
            className="absolute right-2 top-2 z-10 h-8 w-8"
            opacity={0.1}
          />
          {event.flyer_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.flyer_image_url}
              alt={event.title}
              className="aspect-[2/1] w-full shrink-0 object-cover"
            />
          )}
          <CardHeader className="pb-0 pt-2.5">
            <CardTitle id={headingId} className="text-bone">
              {event.title}
            </CardTitle>
            {djNames.length > 0 && (
              <p className="mt-1 text-sm leading-snug text-stone">
                {djNames.join(" · ")}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 py-0">
            <div className="flex items-center gap-1.5 text-sm text-stone">
              <Calendar className="size-4 shrink-0" />
              <span>{formatEventDateTimeLine(event)}</span>
            </div>
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-stone">
                <MapPin className="size-4 shrink-0" />
                <span>{location}</span>
              </div>
            )}
            {event.genres && event.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {event.genres.map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            )}
            {event.status !== "published" && (
              <Badge variant={statusVariant(event.status)} className="mt-1 w-fit">
                {event.status}
              </Badge>
            )}
          </CardContent>
        </Link>
        <div className="flex cursor-default items-center justify-between gap-2 border-t border-root-line px-4 py-2">
          <EventLikeControl
            eventId={event.id}
            likesCount={event.likes_count ?? 0}
            likedByMe={likedByMe}
            currentUserId={currentUserId}
            onLikeChange={onLikeChange}
            variant="footer"
          />
          <CommentCountModalTrigger
            commentableType="event"
            commentableId={event.id}
            title={event.title}
            variant="badge"
          />
        </div>
      </Card>
    </article>
  );
}
