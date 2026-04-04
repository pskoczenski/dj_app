"use client";

import { use, useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEvent } from "@/hooks/use-event";
import { EventForm } from "@/components/events/event-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import type { LineupEntry } from "@/components/events/lineup-builder";
import type { EventLineupWithProfile } from "@/types";
import { formatSetTimeForInput } from "@/lib/utils/format-set-time-for-input";

function lineupToFormEntries(lineup: EventLineupWithProfile[]): LineupEntry[] {
  return lineup.map((item, i) => {
    const p = item.profile;
    return {
      tempId: `existing-${item.id}`,
      eventLineupId: item.id,
      profileId: item.profile_id,
      displayName: p?.display_name ?? "Unknown",
      slug: p?.slug ?? "",
      profileImageUrl: p?.profile_image_url ?? null,
      isHeadliner: item.is_headliner ?? false,
      setTime: formatSetTimeForInput(item.set_time),
      sortOrder: item.sort_order ?? i,
    };
  });
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: userLoading } = useCurrentUser();
  const { event, lineup, loading: eventLoading } = useEvent(id);

  const initialLineup = useMemo(() => lineupToFormEntries(lineup), [lineup]);

  const loading = userLoading || eventLoading;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        title="Event not found"
        description="This event may have been removed."
      />
    );
  }

  if (!user || user.id !== event.created_by) {
    return (
      <EmptyState
        title="Not authorized"
        description="Only the event creator can edit this event."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-bone">
        Edit Event
      </h1>
      <EventForm
        mode="edit"
        event={event}
        initialLineup={initialLineup}
        currentUserId={user.id}
      />
    </div>
  );
}
