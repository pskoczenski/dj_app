"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useLocation } from "@/hooks/use-location";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventPreviewModal } from "@/components/events/event-preview-modal";
import { EventCalendarDayModal } from "@/components/events/event-calendar-day-modal";
import type { CalendarEvent } from "@/types";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MAX_DESKTOP_TITLES = 3;
const MAX_MOBILE_DOTS = 4;

function startOfCalendarGrid(month: Date): Date {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const offsetToMonday = (first.getDay() + 6) % 7;
  return new Date(y, m, 1 - offsetToMonday);
}

function endOfCalendarGrid(month: Date): Date {
  const y = month.getFullYear();
  const m = month.getMonth();
  const last = new Date(y, m + 1, 0);
  const daysToSunday = (7 - last.getDay()) % 7;
  return new Date(y, m, last.getDate() + daysToSunday);
}

function enumerateInclusive(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endTime = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime();
  while (cur.getTime() <= endTime) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(month: Date): string {
  return month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDayShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatAriaEventDate(ev: CalendarEvent): string {
  return new Date(ev.start_date + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function EventCalendar({
  initialMonth,
  selectedGenreIds = [],
}: {
  initialMonth?: Date;
  /** When non-empty, calendar fetch uses OR overlap on `genre_ids`. */
  selectedGenreIds?: string[];
}) {
  const { activeCity } = useLocation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = initialMonth ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const reducedMotion = usePrefersReducedMotion();

  const gridStart = useMemo(
    () => startOfCalendarGrid(currentMonth),
    [currentMonth],
  );
  const gridEnd = useMemo(() => endOfCalendarGrid(currentMonth), [currentMonth]);
  const startDate = useMemo(() => toISODate(gridStart), [gridStart]);
  const endDate = useMemo(() => toISODate(gridEnd), [gridEnd]);

  const { events, eventsByDate, loading, error } = useCalendarEvents(
    startDate,
    endDate,
    {
      cityId: activeCity.id,
      genreIds: selectedGenreIds.length ? selectedGenreIds : undefined,
    },
  );

  const weeks = useMemo(() => {
    const days = enumerateInclusive(gridStart, gridEnd);
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [gridStart, gridEnd]);

  const today = new Date();
  const nowMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const isViewingCurrentMonth = sameCalendarDay(currentMonth, nowMonthStart);

  function goPrev() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function goNext() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function goToday() {
    const n = new Date();
    setCurrentMonth(new Date(n.getFullYear(), n.getMonth(), 1));
  }

  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={goPrev}
          aria-label="Previous month"
          className="shrink-0 text-bone hover:bg-mb-surface-1/80"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div
          aria-live="polite"
          className="heading-subtle min-w-0 flex-1 text-center text-xl font-semibold text-bone"
        >
          {formatMonthYear(currentMonth)}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isViewingCurrentMonth ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToday}
              className="text-xs"
            >
              Today
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goNext}
            aria-label="Next month"
            className="text-bone hover:bg-mb-surface-1/80"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-center text-sm text-dried-blood" role="alert">
          Could not load calendar events.
        </p>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-default border border-mb-border-hair bg-mb-surface-2/80 shadow-default",
          !reducedMotion && "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
        )}
        key={monthKey}
      >
        <div
          role="grid"
          aria-label="Event calendar"
          className="flex flex-col"
        >
          <div
            role="row"
            className="grid grid-cols-7 border-b border-mb-border-hair bg-mb-surface-1/50"
          >
            {DOW.map((label) => (
              <div
                key={label}
                role="columnheader"
                className="px-1 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-fog md:text-xs"
              >
                {label}
              </div>
            ))}
          </div>

          {weeks.map((week) => (
            <div
              key={week[0]!.getTime()}
              role="row"
              className="grid grid-cols-7 border-b border-mb-border-hair last:border-b-0"
            >
              {week.map((dayDate) => {
                const key = toISODate(dayDate);
                const inMonth =
                  dayDate.getMonth() === currentMonth.getMonth() &&
                  dayDate.getFullYear() === currentMonth.getFullYear();
                const dayEvents = eventsByDate.get(key) ?? [];
                const isTodayCell = sameCalendarDay(dayDate, today);
                const visibleDesktop = dayEvents.slice(0, MAX_DESKTOP_TITLES);
                const overflow = dayEvents.length - visibleDesktop.length;

                return (
                  <div
                    key={key}
                    role="gridcell"
                    className={cn(
                      "relative flex min-h-[5.5rem] flex-col gap-0.5 border-r border-mb-border-hair p-1 last:border-r-0 md:min-h-[7.5rem]",
                      !inMonth && "bg-mb-surface-1/30",
                      isTodayCell &&
                        "shadow-[inset_0_0_0_1px_rgba(122,176,176,0.22)]",
                    )}
                  >
                    <div className="flex shrink-0 justify-between gap-1">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center text-xs font-medium tabular-nums md:text-sm",
                          !inMonth && "text-fog",
                          inMonth && !isTodayCell && "text-stone",
                          isTodayCell &&
                            "rounded-full bg-mb-turquoise-deep text-mb-turquoise-ice",
                        )}
                      >
                        {dayDate.getDate()}
                      </span>
                    </div>

                    {loading && inMonth ? (
                      <div className="mt-1 space-y-1">
                        <Skeleton className="h-2 w-full rounded-sm" />
                        <Skeleton className="hidden h-2 w-4/5 rounded-sm md:block" />
                      </div>
                    ) : (
                      <>
                        <div className="mt-1 hidden min-h-0 flex-1 flex-col gap-0.5 md:flex">
                          {visibleDesktop.map((ev) => (
                            <EventPreviewModal
                              key={ev.id}
                              event={ev}
                              trigger={
                                <button
                                  type="button"
                                  className={cn(
                                    "w-full truncate rounded-[0_3px_3px_0] border-l-2 bg-mb-surface-2 py-0.5 pl-1.5 text-left text-[11px] hover:bg-mb-surface-3 focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/50 md:text-xs",
                                    isTodayCell
                                      ? "border-mb-turquoise-pale text-mb-turquoise-ice hover:text-mb-text-primary"
                                      : "border-mb-turquoise-mid text-mb-text-secondary hover:text-mb-text-primary",
                                  )}
                                  title={ev.title}
                                  aria-label={`View event: ${ev.title}, ${formatAriaEventDate(ev)}`}
                                >
                                  {ev.title}
                                </button>
                              }
                            />
                          ))}
                          {overflow > 0 ? (
                            <EventCalendarDayModal
                              date={dayDate}
                              events={dayEvents}
                              trigger={
                                <button
                                  type="button"
                                  className="text-left text-[10px] font-medium text-mb-text-tertiary hover:text-mb-turquoise-pale hover:underline focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/50 md:text-xs"
                                  aria-label={`Show ${overflow} more events on ${formatDayShort(dayDate)}`}
                                >
                                  +{overflow} more
                                </button>
                              }
                            />
                          ) : null}
                        </div>

                        <div className="mt-auto flex flex-col gap-1 md:hidden">
                          {dayEvents.length > 0 ? (
                            <>
                              <div
                                className="flex flex-wrap items-center gap-1"
                                aria-hidden
                              >
                                {dayEvents
                                  .slice(0, MAX_MOBILE_DOTS)
                                  .map((ev) => (
                                    <span
                                      key={ev.id}
                                      className="size-1.5 shrink-0 rounded-full bg-mb-turquoise-mid"
                                    />
                                  ))}
                              </div>
                              <EventCalendarDayModal
                                date={dayDate}
                                events={dayEvents}
                                trigger={
                                  <button
                                    type="button"
                                    className="w-full rounded-default border border-mb-border-hair py-1 text-[10px] text-fog hover:bg-mb-surface-1/80 focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/50"
                                    aria-label={`Open ${dayEvents.length} events on ${formatDayShort(dayDate)}`}
                                  >
                                    View day
                                  </button>
                                }
                              />
                            </>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {!error && !loading && events.length === 0 ? (
        <p className="text-center text-sm text-stone" role="status">
          {selectedGenreIds.length > 0
            ? `No events matching these genres in ${activeCity.name} this month.`
            : `No events in ${activeCity.name} this month.`}
        </p>
      ) : null}
    </div>
  );
}
