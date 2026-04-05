"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEvent } from "@/hooks/use-event";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLikedEventIds } from "@/hooks/use-liked-event-ids";
import { useConversations } from "@/hooks/use-conversations";
import { eventLineupService } from "@/lib/services/event-lineup";
import { conversationsService } from "@/lib/services/conversations";
import { eventsService } from "@/lib/services/events";
import { CancelledBanner } from "@/components/events/cancelled-banner";
import { CommentCountModalTrigger } from "@/components/comments/comment-count-modal-trigger";
import { EventLikeControl } from "@/components/events/event-like-control";
import { ShareButton } from "@/components/events/share-button";
import { LineupCard } from "@/components/events/lineup-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Pencil,
  Trash2,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { formatSetTime12h } from "@/lib/format-time";
import type { EventLineupWithProfile } from "@/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { event, lineup, loading, error, refetch } = useEvent(id);
  const { user } = useCurrentUser();
  const serverLikedEventIds = useLikedEventIds(event ? [event.id] : [], user?.id);
  const [optLike, setOptLike] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setOptLike(null);
  }, [event?.id, event?.likes_count]);
  const { conversations, refetch: refetchConversations } = useConversations();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <EmptyState
        title="Event not found"
        description="This event may have been removed."
      />
    );
  }

  const isCreator = user?.id === event.created_by;
  const userLineupEntry: EventLineupWithProfile | undefined = user
    ? lineup.find((l) => l.profile_id === user.id)
    : undefined;

  const eventGroupThread = conversations.find(
    (c) => c.type === "event_group" && c.event_id === event.id,
  );
  const groupUnread = eventGroupThread?.unreadCount ?? 0;

  const groupChatEligible =
    event.status === "published" || event.status === "cancelled";

  const location = [
    event.venue,
    event.street_address,
    event.cities?.name,
    event.cities?.state_code,
    event.country,
  ]
    .filter(Boolean)
    .join(", ");

  // The creator profile is joined in getById as `profiles`
  const creator = (event as Record<string, unknown>).profiles as
    | { id: string; display_name: string; slug: string; profile_image_url: string | null }
    | undefined;

  const detailLikedByMe =
    optLike !== null ? optLike.liked : serverLikedEventIds.has(event.id);
  const detailLikesCount =
    optLike !== null ? optLike.count : (event.likes_count ?? 0);

  async function handleRemoveSelf() {
    if (!userLineupEntry) return;
    try {
      await eventLineupService.remove(userLineupEntry.id);
      toast.success("You've been removed from the lineup.");
      refetch();
      void refetchConversations();
    } catch {
      toast.error("Failed to remove yourself from the lineup.");
    }
  }

  const canOpenGroupChat =
    groupChatEligible && (isCreator || Boolean(userLineupEntry));

  async function handleOpenGroupChat() {
    if (!event) return;
    try {
      const conversationId = await conversationsService.createEventGroupThread(
        event.id,
        user?.id,
      );
      router.push(`/messages/${conversationId}`);
    } catch {
      toast.error("Could not open group chat.");
    }
  }

  async function handleConfirmDeleteEvent() {
    if (!event) return;
    setDeleteBusy(true);
    try {
      await eventsService.softDelete(event.id);
      toast.success("Event deleted.");
      setDeleteDialogOpen(false);
      router.push("/events");
    } catch {
      toast.error("Could not delete event. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {event.status === "cancelled" && <CancelledBanner />}

      {/* Hero / Flyer */}
      {event.flyer_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.flyer_image_url}
          alt={event.title}
          className="aspect-[2/1] w-full rounded-default object-cover"
        />
      )}

      {/* Title & actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-bone">
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <EventLikeControl
            eventId={event.id}
            likesCount={detailLikesCount}
            likedByMe={detailLikedByMe}
            currentUserId={user?.id}
            onLikeChange={(next) =>
              setOptLike({ liked: next.liked, count: next.likesCount })
            }
            variant="inline"
            className="rounded-default border border-root-line px-2 py-1.5"
          />
          <ShareButton title={event.title} />
          {canOpenGroupChat && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void handleOpenGroupChat()}
              aria-label={
                groupUnread > 0
                  ? `Group chat, ${groupUnread} unread`
                  : "Group chat"
              }
            >
              Group Chat
              {groupUnread > 0 ? (
                <Badge
                  variant="secondary"
                  className="min-w-6 px-1.5 text-xs tabular-nums"
                >
                  {groupUnread}
                </Badge>
              ) : null}
            </Button>
          )}
          {isCreator && (
            <>
              <Link
                href={`/events/${event.id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Pencil className="mr-1.5 size-4" />
                Edit
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-dried-blood/50 text-dried-blood hover:bg-dried-blood/10 dark:text-dried-blood"
                onClick={() => setDeleteDialogOpen(true)}
                aria-label="Delete event"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </>
          )}
          {userLineupEntry && !isCreator && (
            <Button variant="destructive" size="sm" onClick={handleRemoveSelf}>
              <UserMinus className="mr-1.5 size-4" />
              Leave Lineup
            </Button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-stone">
          <Calendar className="size-4 shrink-0" />
          <span>{formatDate(event.start_date)}</span>
          {event.end_date && event.end_date !== event.start_date && (
            <span className="text-fog">— {formatDate(event.end_date)}</span>
          )}
        </div>
        {(event.start_time || event.end_time) && (
          <div className="flex items-center gap-2 text-stone">
            <Clock className="size-4 shrink-0" />
            <span>
              {[
                event.start_time && formatSetTime12h(event.start_time),
                event.end_time && formatSetTime12h(event.end_time),
              ]
                .filter(Boolean)
                .join(" — ")}
            </span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-2 text-stone">
            <MapPin className="size-4 shrink-0" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Genres */}
      {event.genres && event.genres.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {event.genres.map((g) => (
            <Badge key={g} variant="secondary">
              {g}
            </Badge>
          ))}
        </div>
      )}

      <div>
        <CommentCountModalTrigger
          commentableType="event"
          commentableId={event.id}
          title={event.title}
          variant="detail"
        />
      </div>

      {/* Description */}
      {event.description && (
        <div className="prose prose-invert max-w-none text-stone">
          <p className="whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Ticket CTA — below description, compact, centered */}
      {event.ticket_url && (
        <div className="flex justify-center">
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default"}),
            )}
          >
            <ExternalLink className="mr-1.5 size-4" />
            Get Tickets
          </a>
        </div>
      )}

      {/* Lineup */}
      {lineup.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-bone">
            Lineup
          </h2>
          <div className="flex flex-col gap-2">
            {lineup.map((item) => (
              <LineupCard
                key={item.id}
                item={item}
                profile={item.profile ?? undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Posted By */}
      {creator && (
        <section>
          <h2 className="mb-3 heading-subtle text-xl font-bold text-bone">
            Posted By
          </h2>
          <Link
            href={`/dj/${creator.slug}`}
            className="flex items-center gap-3 rounded-default border border-root-line p-3 transition-colors hover:border-sage-edge"
          >
            <Avatar className="size-10 shrink-0">
              {creator.profile_image_url ? (
                <AvatarImage
                  src={creator.profile_image_url}
                  alt={creator.display_name}
                />
              ) : null}
              <AvatarFallback className="text-xs">
                {creator.display_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-bone">
              {creator.display_name}
            </span>
          </Link>
        </section>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting removes this event from discovery, search, and calendars.
              It cannot be undone; people in an existing group chat may still see
              a short notice. To keep the listing visible but marked as cancelled,
              use Edit → Cancel event instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Back</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void handleConfirmDeleteEvent()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
