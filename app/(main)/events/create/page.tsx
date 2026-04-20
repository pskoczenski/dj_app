"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { EventForm } from "@/components/events/event-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function CreateEventPage() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="py-12 text-center text-stone">
        You must be logged in to create an event.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1
        className="mb-6 font-display text-2xl font-bold text-bone"
        data-ftue="ftue-create-heading"
      >
        Create Event
      </h1>
      <EventForm mode="create" currentUserId={user.id} />
    </div>
  );
}
