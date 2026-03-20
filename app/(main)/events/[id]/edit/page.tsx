"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEvent } from "@/hooks/use-event";
import { profilesService } from "@/lib/services/profiles";
import { EventForm } from "@/components/events/event-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import type { LineupEntry } from "@/components/events/lineup-builder";
import type { Profile } from "@/types";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const { event, lineup, loading: eventLoading } = useEvent(id);
  const [initialLineup, setInitialLineup] = useState<LineupEntry[] | null>(
    null,
  );

  useEffect(() => {
    if (!lineup.length) {
      setInitialLineup([]);
      return;
    }

    let cancelled = false;
    Promise.all(
      lineup.map((item) => profilesService.getById(item.profile_id)),
    ).then((profiles) => {
      if (cancelled) return;
      const entries: LineupEntry[] = lineup.map((item, i) => {
        const p = profiles[i] as Profile | null;
        return {
          tempId: `existing-${item.id}`,
          profileId: item.profile_id,
          displayName: p?.display_name ?? "Unknown",
          slug: p?.slug ?? "",
          profileImageUrl: p?.profile_image_url ?? null,
          isHeadliner: item.is_headliner ?? false,
          setTime: item.set_time ?? "",
          sortOrder: item.sort_order ?? i,
        };
      });
      setInitialLineup(entries);
    });

    return () => {
      cancelled = true;
    };
  }, [lineup]);

  const loading = userLoading || eventLoading || initialLineup === null;

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
        initialLineup={initialLineup ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
