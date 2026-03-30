"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EventCard } from "@/components/events/event-card";
import { calendarEventToCardEvent } from "@/lib/calendar-event-adapter";
import type { CalendarEvent } from "@/types";

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function EventCalendarDayModal({
  date,
  events,
  trigger,
}: {
  date: Date;
  events: CalendarEvent[];
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const title = useMemo(() => formatDayHeader(date), [date]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        showCloseButton
        className="flex max-h-[min(85vh,40rem)] w-full max-w-lg flex-col gap-3 overflow-hidden sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-bone">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <p className="text-center text-sm text-stone">No events on this day.</p>
          ) : (
            events.map((e) => (
              <EventCard key={e.id} event={calendarEventToCardEvent(e)} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
