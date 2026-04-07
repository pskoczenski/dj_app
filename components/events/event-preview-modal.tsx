"use client";

import { useMemo, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLikedEventIds } from "@/hooks/use-liked-event-ids";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EventLikeControl } from "@/components/events/event-like-control";
import { CommentCountModalTrigger } from "@/components/comments/comment-count-modal-trigger";
import { calendarEventToCardEvent } from "@/lib/calendar-event-adapter";
import { formatSetTime12h } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, XIcon } from "lucide-react";
import type { CalendarEvent } from "@/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventDateTimeLine(event: {
  start_date: string;
  start_time: string | null;
  end_time: string | null;
}): string {
  const datePart = formatDate(event.start_date);
  const start = event.start_time ? formatSetTime12h(event.start_time) : null;
  const end = event.end_time ? formatSetTime12h(event.end_time) : null;
  if (start && end) return `${datePart} · ${start} – ${end}`;
  if (start) return `${datePart} · ${start}`;
  if (end) return `${datePart} · ${end}`;
  return datePart;
}

export function EventPreviewModal({
  event,
  trigger,
}: {
  event: CalendarEvent;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const cardEvent = useMemo(() => calendarEventToCardEvent(event), [event]);
  const { user } = useCurrentUser();
  const likedEventIds = useLikedEventIds([event.id], user?.id);
  const titleId = `event-preview-title-${event.id}`;

  const location = [
    cardEvent.venue,
    cardEvent.street_address,
    cardEvent.cities?.name,
    cardEvent.cities?.state_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        showCloseButton={false}
        aria-labelledby={titleId}
        className={cn(
          // Single container: no nested footer region, no card-in-card feeling.
          "w-full max-w-lg overflow-hidden border border-mb-border-hair bg-mb-surface-2 p-0 shadow-xl",
          // Motion: subtle fade + scale in/out.
          "data-open:duration-200 data-open:zoom-in-95 data-open:ease-out data-closed:duration-150 data-closed:zoom-out-95 data-closed:ease-in",
        )}
      >
        <div className="relative">
          {cardEvent.flyer_image_url ? (
            <div className="relative aspect-[2/1] w-full overflow-hidden">
              {/* Blur fill — scale-110 hides the soft edge that blur-xl produces */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardEvent.flyer_image_url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardEvent.flyer_image_url}
                alt={cardEvent.title}
                className="relative z-10 h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[2/1] w-full bg-mb-surface-3" aria-hidden />
          )}

          <DialogClose
            aria-label="Close"
            className={cn(
              // Strong close affordance: always legible over artwork.
              "absolute right-3 top-3 z-20 inline-flex size-10 items-center justify-center rounded-full",
              "bg-black/45 text-mb-text-primary shadow-sm ring-1 ring-white/10",
              "supports-backdrop-filter:backdrop-blur-md",
              "transition-colors hover:bg-black/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2",
            )}
          >
            <XIcon className="size-4" aria-hidden />
          </DialogClose>
        </div>

        <div
          className={cn(
            // Whole preview is the primary click target to navigate.
            "group relative flex flex-col gap-3 p-4 md:p-5",
            "cursor-pointer transition-all duration-200 ease-out",
            "hover:-translate-y-0.5 hover:border-mb-border-soft hover:shadow-lg",
            "focus-within:ring-2 focus-within:ring-mb-turquoise-mid/40 focus-within:ring-offset-2 focus-within:ring-offset-mb-surface-2",
          )}
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/events/${event.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/events/${event.id}`);
            }
          }}
        >
          <DialogTitle
            id={titleId}
            className="font-display text-xl font-semibold leading-snug tracking-tight text-mb-text-primary"
          >
            {cardEvent.title}
          </DialogTitle>

          <div className="space-y-2 text-sm text-mb-text-secondary">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 size-4 shrink-0 text-mb-text-tertiary" />
              <span>{formatEventDateTimeLine(cardEvent)}</span>
            </div>
            {location ? (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-mb-text-tertiary" />
                <span className="line-clamp-2">{location}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {cardEvent.genres && cardEvent.genres.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-2">
                {cardEvent.genres.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="h-auto min-h-0 rounded-full border-mb-border-soft bg-transparent px-3 py-1 text-[11px] font-medium text-mb-text-tertiary"
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <EventLikeControl
                eventId={event.id}
                likesCount={cardEvent.likes_count ?? 0}
                likedByMe={likedEventIds.has(event.id)}
                currentUserId={user?.id}
                variant="inline"
                className={cn(
                  // Muted, right-aligned indicators (preview-level).
                  "rounded-md bg-transparent px-1 py-0.5 text-mb-text-tertiary hover:bg-mb-surface-3 hover:text-mb-text-primary",
                  "focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-2",
                )}
              />
              <CommentCountModalTrigger
                commentableType="event"
                commentableId={event.id}
                title={event.title}
                variant="badge"
                stopPropagation
                className="min-w-0 rounded-md bg-transparent px-1 py-0.5 text-mb-text-tertiary hover:bg-mb-surface-3 hover:text-mb-text-primary"
              />
            </div>
          </div>

          <div
            className={cn(
              // Subtle affordance revealed on hover to signal navigation.
              "pointer-events-none mt-1 text-xs font-medium tracking-wide text-mb-text-tertiary opacity-0 transition-opacity duration-200 ease-out",
              "group-hover:opacity-100",
            )}
            aria-hidden
          >
            View event →{/* intentionally subtle */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
