"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { eventsService, type EventFilters } from "@/lib/services/events";
import { eventSavesService } from "@/lib/services/event-saves";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLikedEventIds } from "@/hooks/use-liked-event-ids";
import { useSavedEventIds } from "@/hooks/use-saved-event-ids";
import { useLocation } from "@/hooks/use-location";
import { EventCard } from "@/components/events/event-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { areQueryStringsEqual } from "@/lib/utils/compare-query-string";
import { Bookmark, CalendarDays, List, Search, SlidersHorizontal } from "lucide-react";
import { EventCalendar } from "@/components/events/event-calendar";
import { GenreMultiSelectPopover } from "@/components/shared/genre-multi-select-popover";
import type { EventWithLineupPreview } from "@/types";

const PAGE_SIZE = 12;

export default function EventsPage() {
  return (
    <Suspense>
      <EventsBrowser />
    </Suspense>
  );
}

function EventsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCity } = useLocation();
  const { user: currentUser } = useCurrentUser();

  const [events, setEvents] = useState<EventWithLineupPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [stateFilter, setStateFilter] = useState(searchParams.get("state") ?? "");
  const [sort, setSort] = useState<EventFilters["sort"]>(
    (searchParams.get("sort") as EventFilters["sort"]) ?? "soonest",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  const filterSaved = searchParams.get("filter") === "saved";
  const [savedEvents, setSavedEvents] = useState<EventWithLineupPreview[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const serverLikedIds = useLikedEventIds(eventIds, currentUser?.id);
  const serverSavedIds = useSavedEventIds(eventIds, currentUser?.id);
  const eventsListKey = eventIds.join("\0");
  const [optimisticLiked, setOptimisticLiked] = useState<Record<string, boolean>>(
    {},
  );
  const [optimisticSaved, setOptimisticSaved] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    setOptimisticLiked({});
    setOptimisticSaved({});
  }, [eventsListKey]);

  const likedByMe = useCallback(
    (eventId: string) =>
      Object.hasOwn(optimisticLiked, eventId)
        ? optimisticLiked[eventId]
        : serverLikedIds.has(eventId),
    [optimisticLiked, serverLikedIds],
  );

  const savedByMe = useCallback(
    (eventId: string) => {
      if (filterSaved) {
        return Object.hasOwn(optimisticSaved, eventId)
          ? optimisticSaved[eventId]
          : true;
      }
      return Object.hasOwn(optimisticSaved, eventId)
        ? optimisticSaved[eventId]
        : serverSavedIds.has(eventId);
    },
    [optimisticSaved, serverSavedIds, filterSaved],
  );

  function handleEventLikeChange(
    eventId: string,
    next: { liked: boolean; likesCount: number },
  ) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, likes_count: next.likesCount } : e,
      ),
    );
    setSavedEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, likes_count: next.likesCount } : e,
      ),
    );
    setOptimisticLiked((o) => ({ ...o, [eventId]: next.liked }));
  }

  function handleEventSaveChange(
    eventId: string,
    next: { saved: boolean; savesCount: number },
  ) {
    const patch = (list: EventWithLineupPreview[]) =>
      list.map((e) =>
        e.id === eventId ? { ...e, saves_count: next.savesCount } : e,
      );
    setEvents((prev) => patch(prev));
    if (filterSaved && !next.saved) {
      setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));
    } else {
      setSavedEvents((prev) => patch(prev));
    }
    setOptimisticSaved((o) => ({ ...o, [eventId]: next.saved }));
  }

  const viewMode =
    searchParams.get("view") === "calendar" ? "calendar" : "list";

  const routerRef = useRef(router);
  routerRef.current = router;
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  function setViewMode(mode: "list" | "calendar") {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "calendar") params.set("view", "calendar");
    else params.delete("view");
    const qs = params.toString();
    router.replace(`/events${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function toggleSavedFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("filter") === "saved") {
      params.delete("filter");
    } else {
      params.set("filter", "saved");
    }
    const qs = params.toString();
    router.replace(`/events${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listSectionRef = useRef<HTMLDivElement>(null);
  const prevCityIdRef = useRef<string | null>(null);
  const appendInFlightRef = useRef(false);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setEvents([]);
      }

      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const filters: EventFilters = {
          sort,
          cityId: activeCity.id,
        };
        if (stateFilter) filters.state = stateFilter;
        if (selectedGenreIds.length > 0) filters.genreIds = selectedGenreIds;
        filters.range = [from, to];

        const data = await eventsService.getAll(filters);

        const filtered = search
          ? data.filter(
              (e) =>
                e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.venue?.toLowerCase().includes(search.toLowerCase()) ||
                e.street_address
                  ?.toLowerCase()
                  .includes(search.toLowerCase()) ||
                e.cities?.name?.toLowerCase().includes(search.toLowerCase()),
            )
          : data;

        if (append) {
          setEvents((prev) => [...prev, ...filtered]);
        } else {
          setEvents(filtered);
        }
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        // Errors are non-fatal for browse
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, stateFilter, sort, activeCity.id, selectedGenreIds],
  );

  useEffect(() => {
    if (filterSaved) return;
    pageRef.current = 0;
    setHasMore(true);
    fetchPage(0, false);
  }, [fetchPage, filterSaved]);

  useEffect(() => {
    if (!filterSaved || !currentUser?.id) {
      setSavedEvents([]);
      return;
    }
    let cancelled = false;
    setSavedLoading(true);
    eventSavesService
      .getSavedEvents(currentUser.id)
      .then((evts) => {
        if (!cancelled) setSavedEvents(evts);
      })
      .catch(() => {
        if (!cancelled) setSavedEvents([]);
      })
      .finally(() => {
        if (!cancelled) setSavedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterSaved, currentUser?.id]);

  useEffect(() => {
    if (viewMode !== "list") {
      prevCityIdRef.current = activeCity.id;
      return;
    }
    if (prevCityIdRef.current === null) {
      prevCityIdRef.current = activeCity.id;
      return;
    }
    if (prevCityIdRef.current !== activeCity.id) {
      const el = listSectionRef.current;
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "start", behavior: "auto" });
      }
    }
    prevCityIdRef.current = activeCity.id;
  }, [activeCity.id, viewMode]);

  // Sync local filters to URL. Do not depend on `router` or `searchParams.toString()` — those
  // update after replace() and can retrigger this effect forever (navigation loop).
  useEffect(() => {
    const sp = searchParamsRef.current;
    const currentQs = sp.toString();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (stateFilter) params.set("state", stateFilter);
    if (sort && sort !== "soonest") params.set("sort", sort);
    if (sp.get("view") === "calendar") {
      params.set("view", "calendar");
    }
    if (sp.get("filter") === "saved") {
      params.set("filter", "saved");
    }
    const nextQs = params.toString();
    if (areQueryStringsEqual(nextQs, currentQs)) return;
    routerRef.current.replace(`/events${nextQs ? `?${nextQs}` : ""}`, {
      scroll: false,
    });
  }, [search, stateFilter, sort]);

  // Infinite scroll via IntersectionObserver (disabled in saved mode)
  useEffect(() => {
    if (filterSaved) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !entries[0]?.isIntersecting ||
          !hasMore ||
          loadingMore ||
          loading ||
          appendInFlightRef.current
        ) {
          return;
        }
        appendInFlightRef.current = true;
        pageRef.current += 1;
        void fetchPage(pageRef.current, true).finally(() => {
          appendInFlightRef.current = false;
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPage, filterSaved]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-bone">Events</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-default border border-mb-border-hair bg-mb-surface-2 p-[3px]"
            role="group"
            aria-label="Events view mode"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-[5px] shadow-none",
                viewMode === "list"
                  ? "bg-mb-surface-3 text-mb-text-primary hover:bg-mb-surface-3 hover:text-mb-text-primary"
                  : "bg-transparent text-mb-text-tertiary hover:bg-transparent hover:text-mb-text-primary",
              )}
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-[5px] shadow-none",
                viewMode === "calendar"
                  ? "bg-mb-surface-3 text-mb-text-primary hover:bg-mb-surface-3 hover:text-mb-text-primary"
                  : "bg-transparent text-mb-text-tertiary hover:bg-transparent hover:text-mb-text-primary",
              )}
              aria-pressed={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
            >
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSavedFilter}
            aria-pressed={filterSaved}
            aria-label={filterSaved ? "Show all events" : "Show saved events"}
            className={cn(
              filterSaved &&
                "bg-mb-surface-3 text-mb-text-primary hover:bg-mb-surface-3 hover:text-mb-text-primary",
            )}
          >
            <Bookmark
              className={cn(
                "mr-1.5 size-4",
                filterSaved ? "fill-mb-turquoise-pale text-mb-turquoise-pale" : "",
              )}
              strokeWidth={filterSaved ? 0 : 2}
              aria-hidden
            />
            Saved
          </Button>
          {viewMode === "list" && !filterSaved ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="mr-1.5 size-4" />
              Filters
            </Button>
          ) : viewMode === "calendar" ? (
            <GenreMultiSelectPopover
              triggerId="events-calendar-genre-trigger"
              selectedGenreIds={selectedGenreIds}
              onChange={setSelectedGenreIds}
              idleLabel="Any genre"
            />
          ) : null}
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Search (hidden in saved mode) */}
          {!filterSaved && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fog" />
              <Input
                placeholder="Search events by title, venue, address, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search events"
              />
            </div>
          )}

          {/* Filters (hidden in saved mode) */}
          {!filterSaved && showFilters && (
            <div className="flex flex-wrap items-end gap-3">
              <Input
                placeholder="State (e.g. CA)"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-32"
                aria-label="Filter by state"
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="events-genre-filter-trigger"
                  className="text-xs text-fog"
                >
                  Genres
                </label>
                <GenreMultiSelectPopover
                  triggerId="events-genre-filter-trigger"
                  selectedGenreIds={selectedGenreIds}
                  onChange={setSelectedGenreIds}
                  idleLabel="Any genre"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as EventFilters["sort"])}
                className="rounded-default border border-root-line bg-deep-loam px-3 py-2 text-sm text-bone"
                aria-label="Sort events"
              >
                <option value="soonest">Soonest</option>
                <option value="latest">Latest</option>
                <option value="added">Recently Added</option>
              </select>
            </div>
          )}

          {/* Saved events view */}
          {filterSaved ? (
            <div ref={listSectionRef}>
              <p className="sr-only" aria-live="polite" aria-atomic>
                {!savedLoading
                  ? `Showing ${savedEvents.length} saved event${savedEvents.length === 1 ? "" : "s"}.`
                  : ""}
              </p>
              {savedLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : savedEvents.length === 0 ? (
                <EmptyState
                  title="No saved events"
                  description="Tap the bookmark icon on any event to save it here."
                  action={
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={toggleSavedFilter}
                    >
                      Browse events
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      likedByMe={likedByMe(event.id)}
                      savedByMe={savedByMe(event.id)}
                      currentUserId={currentUser?.id}
                      onLikeChange={(next) =>
                        handleEventLikeChange(event.id, next)
                      }
                      onSaveChange={(next) =>
                        handleEventSaveChange(event.id, next)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Regular events list */
            <div ref={listSectionRef}>
              <p className="sr-only" aria-live="polite" aria-atomic>
                {!loading
                  ? `Showing ${events.length} event${events.length === 1 ? "" : "s"}.`
                  : ""}
              </p>
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : events.length === 0 ? (
                search.trim() ? (
                  <EmptyState
                    title="No events found"
                    description="Try adjusting your search or filters."
                  />
                ) : selectedGenreIds.length > 0 ? (
                  <EmptyState
                    title={`No events matching these genres in ${activeCity.name}.`}
                    description="Try other genres or clear the filter."
                    action={
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedGenreIds([])}
                      >
                        Clear genre filter
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    title={`No events in ${activeCity.name} yet.`}
                    description="Check back soon or create one in your area."
                    action={
                      <Link
                        href="/events/create"
                        className={cn(
                          buttonVariants({ variant: "secondary", size: "sm" }),
                        )}
                      >
                        Create an event
                      </Link>
                    }
                  />
                )
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      likedByMe={likedByMe(event.id)}
                      savedByMe={savedByMe(event.id)}
                      currentUserId={currentUser?.id}
                      onLikeChange={(next) =>
                        handleEventLikeChange(event.id, next)
                      }
                      onSaveChange={(next) =>
                        handleEventSaveChange(event.id, next)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Infinite scroll sentinel (only in regular mode) */}
          {!filterSaved && (
            <>
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <EventCalendar selectedGenreIds={selectedGenreIds} />
      )}
    </div>
  );
}
