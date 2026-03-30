"use client";

import Link from "next/link";
import { useMemo, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { calendarEventToCardEvent } from "@/lib/calendar-event-adapter";
import type { CalendarEvent } from "@/types";

export function EventPreviewModal({
  event,
  trigger,
}: {
  event: CalendarEvent;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const cardEvent = useMemo(() => calendarEventToCardEvent(event), [event]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,48rem)] w-full max-w-lg flex-col gap-0 overflow-y-auto p-4 sm:max-w-lg"
      >
        <div className="pb-2">
          <EventCard event={cardEvent} />
        </div>
        <div className="flex justify-end border-t border-root-line pt-3">
          <Link
            href={`/events/${event.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View event
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
