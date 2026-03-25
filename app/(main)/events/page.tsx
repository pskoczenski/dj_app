"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { eventsService, type EventFilters } from "@/lib/services/events";
import { EventCard } from "@/components/events/event-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
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

  const [events, setEvents] = useState<EventWithLineupPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [stateFilter, setStateFilter] = useState(searchParams.get("state") ?? "");
  const [genreFilter, setGenreFilter] = useState(searchParams.get("genre") ?? "");
  const [sort, setSort] = useState<EventFilters["sort"]>(
    (searchParams.get("sort") as EventFilters["sort"]) ?? "soonest",
  );
  const [showFilters, setShowFilters] = useState(false);

  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  function buildFilters(): EventFilters {
    const filters: EventFilters = { sort };
    if (stateFilter) filters.state = stateFilter;
    if (genreFilter) filters.genre = genreFilter;
    return filters;
  }

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const filters = buildFilters();
        filters.range = [from, to];

        const data = await eventsService.getAll(filters);

        const filtered = search
          ? data.filter(
              (e) =>
                e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.venue?.toLowerCase().includes(search.toLowerCase()) ||
                e.city?.toLowerCase().includes(search.toLowerCase()),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, stateFilter, genreFilter, sort],
  );

  useEffect(() => {
    pageRef.current = 0;
    setHasMore(true);
    fetchPage(0, false);
  }, [fetchPage]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (stateFilter) params.set("state", stateFilter);
    if (genreFilter) params.set("genre", genreFilter);
    if (sort && sort !== "soonest") params.set("sort", sort);
    const qs = params.toString();
    router.replace(`/events${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, stateFilter, genreFilter, sort, router]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          pageRef.current += 1;
          fetchPage(pageRef.current, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-bone">Events</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="mr-1.5 size-4" />
          Filters
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fog" />
        <Input
          placeholder="Search events by title, venue, or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Search events"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="State (e.g. CA)"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-32"
            aria-label="Filter by state"
          />
          <Input
            placeholder="Genre"
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="w-40"
            aria-label="Filter by genre"
          />
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

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}
