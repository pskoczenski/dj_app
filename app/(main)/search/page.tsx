"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebounce } from "@/hooks/use-debounce";
import { useLikedEventIds } from "@/hooks/use-liked-event-ids";
import { useLocation } from "@/hooks/use-location";
import { searchService } from "@/lib/services/search";
import { EventCard } from "@/components/events/event-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search as SearchIcon } from "lucide-react";
import { GenreFilterBar } from "@/components/shared/genre-filter-bar";
import type { Profile, EventWithLineupPreview, MixWithCreator } from "@/types";
import { areQueryStringsEqual } from "@/lib/utils/compare-query-string";

type TabValue = "all" | "djs" | "events" | "mixes";

export default function SearchPage() {
  return (
    <Suspense>
      <SearchBrowser />
    </Suspense>
  );
}

function SearchBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routerRef = useRef(router);
  routerRef.current = router;
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const { activeCity } = useLocation();
  const { user: currentUser } = useCurrentUser();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [tab, setTab] = useState<TabValue>(
    (searchParams.get("tab") as TabValue) ?? "all",
  );
  const debouncedQuery = useDebounce(query, 300);

  const [djs, setDjs] = useState<Profile[]>([]);
  const [events, setEvents] = useState<EventWithLineupPreview[]>([]);
  const [mixes, setMixes] = useState<MixWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  /** When true, DJ + event search is scoped to `activeCity`; mixes are never scoped. */
  const [scopeToActiveCity, setScopeToActiveCity] = useState(true);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const serverLikedIds = useLikedEventIds(eventIds, currentUser?.id);
  const eventsListKey = eventIds.join("\0");
  const [optimisticLiked, setOptimisticLiked] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    setOptimisticLiked({});
  }, [eventsListKey]);

  const likedEventByMe = useCallback(
    (eventId: string) =>
      Object.hasOwn(optimisticLiked, eventId)
        ? optimisticLiked[eventId]
        : serverLikedIds.has(eventId),
    [optimisticLiked, serverLikedIds],
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
    setOptimisticLiked((o) => ({ ...o, [eventId]: next.liked }));
  }

  const runSearch = useCallback(
    async (q: string, cityScoped: boolean, genreIds: string[]) => {
      const qTrim = q.trim();
      const locationOpts =
        cityScoped && activeCity.id ? { cityId: activeCity.id } : {};
      const djOpts = {
        ...locationOpts,
        ...(genreIds.length > 0 ? { genreIds } : {}),
      };

      if (qTrim.length < 2) {
        setEvents([]);
        setMixes([]);
        if (genreIds.length > 0) {
          setLoading(true);
          setHasSearched(true);
          try {
            const d = await searchService.searchDjs("", djOpts);
            setDjs(d);
          } catch {
            setDjs([]);
          } finally {
            setLoading(false);
          }
        } else {
          setDjs([]);
          setHasSearched(false);
        }
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const [d, e, m] = await Promise.all([
          searchService.searchDjs(qTrim, djOpts),
          searchService.searchEvents(qTrim, locationOpts),
          searchService.searchMixes(qTrim),
        ]);
        setDjs(d);
        setEvents(e);
        setMixes(m);
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    },
    [activeCity.id],
  );

  useEffect(() => {
    void runSearch(debouncedQuery, scopeToActiveCity, selectedGenreIds);
  }, [debouncedQuery, scopeToActiveCity, selectedGenreIds, runSearch]);

  // Sync to URL (do not depend on `router` — unstable identity can retrigger forever)
  useEffect(() => {
    const sp = searchParamsRef.current;
    const currentQs = sp.toString();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tab !== "all") params.set("tab", tab);
    const nextQs = params.toString();
    if (areQueryStringsEqual(nextQs, currentQs)) return;
    routerRef.current.replace(`/search${nextQs ? `?${nextQs}` : ""}`, {
      scroll: false,
    });
  }, [query, tab]);

  const totalResults = djs.length + events.length + mixes.length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-bone">Search</h1>

      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fog" />
        <Input
          placeholder="Search DJs, events, mixes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          aria-label="Search"
        />
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Search location scope"
      >
        <Button
          type="button"
          variant={scopeToActiveCity ? "secondary" : "outline"}
          size="sm"
          onClick={() => setScopeToActiveCity(true)}
          aria-pressed={scopeToActiveCity}
        >
          In {activeCity.name}
        </Button>
        <Button
          type="button"
          variant={!scopeToActiveCity ? "secondary" : "outline"}
          size="sm"
          onClick={() => setScopeToActiveCity(false)}
          aria-pressed={!scopeToActiveCity}
        >
          All cities
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-fog">DJ results — filter by genre</p>
        <GenreFilterBar
          selectedGenreIds={selectedGenreIds}
          onChange={setSelectedGenreIds}
        />
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="all"
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
      >
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="djs">DJs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="mixes">Mixes</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !hasSearched ? (
          <p className="py-12 text-center text-stone">
            Start typing to search across DJs, events, and mixes.
          </p>
        ) : totalResults === 0 ? (
          <EmptyState
            title={
              selectedGenreIds.length > 0 &&
              debouncedQuery.trim().length < 2
                ? scopeToActiveCity
                  ? `No DJs matching these genres in ${activeCity.name}.`
                  : "No DJs matching these genres."
                : "No results"
            }
            description={
              selectedGenreIds.length > 0 &&
              debouncedQuery.trim().length < 2
                ? "Clear the genre filter or type at least two characters to search events and mixes."
                : `Nothing matched "${debouncedQuery}". Try a different search.`
            }
          />
        ) : (
          <>
            {/* All tab */}
            <TabsContent value="all">
              <div className="flex flex-col gap-8">
                {djs.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="heading-subtle text-xl font-bold text-bone">
                        DJs
                      </h2>
                      {djs.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setTab("djs")}
                          className="text-sm text-fern hover:underline"
                        >
                          View all
                        </button>
                      )}
                    </div>
                    <DjResultsList profiles={djs.slice(0, 3)} />
                  </section>
                )}
                {events.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="heading-subtle text-xl font-bold text-bone">
                        Events
                      </h2>
                      {events.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setTab("events")}
                          className="text-sm text-fern hover:underline"
                        >
                          View all
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {events.slice(0, 3).map((e) => (
                        <EventCard
                          key={e.id}
                          event={e}
                          likedByMe={likedEventByMe(e.id)}
                          currentUserId={currentUser?.id}
                          onLikeChange={(next) =>
                            handleEventLikeChange(e.id, next)
                          }
                        />
                      ))}
                    </div>
                  </section>
                )}
                {mixes.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="heading-subtle text-xl font-bold text-bone">
                        Mixes
                      </h2>
                      {mixes.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setTab("mixes")}
                          className="text-sm text-fern hover:underline"
                        >
                          View all
                        </button>
                      )}
                    </div>
                    <MixResultsList mixes={mixes.slice(0, 3)} />
                  </section>
                )}
              </div>
            </TabsContent>

            {/* DJs tab */}
            <TabsContent value="djs">
              <h2 className="mb-3 heading-subtle text-xl font-bold text-bone">
                DJs
              </h2>
              {djs.length > 0 ? (
                <DjResultsList profiles={djs} />
              ) : (
                <EmptyState
                  title={
                    selectedGenreIds.length > 0
                      ? scopeToActiveCity
                        ? `No DJs matching these genres in ${activeCity.name}.`
                        : "No DJs matching these genres."
                      : "No DJs found"
                  }
                  description=""
                />
              )}
            </TabsContent>

            {/* Events tab */}
            <TabsContent value="events">
              <h2 className="mb-3 heading-subtle text-xl font-bold text-bone">
                Events
              </h2>
              {events.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      likedByMe={likedEventByMe(e.id)}
                      currentUserId={currentUser?.id}
                      onLikeChange={(next) =>
                        handleEventLikeChange(e.id, next)
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No events found" description="" />
              )}
            </TabsContent>

            {/* Mixes tab */}
            <TabsContent value="mixes">
              <h2 className="mb-3 heading-subtle text-xl font-bold text-bone">
                Mixes
              </h2>
              {mixes.length > 0 ? (
                <MixResultsList mixes={mixes} />
              ) : (
                <EmptyState title="No mixes found" description="" />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function DjResultsList({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="flex flex-col gap-2">
      {profiles.map((p) => {
        const initials = p.display_name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <Link
            key={p.id}
            href={`/dj/${p.slug}`}
            className="flex items-center gap-3 rounded-default border border-root-line p-3 transition-colors hover:border-sage-edge"
          >
            <Avatar className="size-10">
              {p.profile_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.profile_image_url}
                  alt={p.display_name}
                  className="size-full object-cover"
                />
              )}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-bone">{p.display_name}</p>
              <p className="text-xs text-fog">@{p.slug}</p>
            </div>
            {p.cities && (
              <span className="text-xs text-fog">
                {p.cities.name}
                {p.cities.state_code ? `, ${p.cities.state_code}` : ""}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function MixResultsList({ mixes }: { mixes: MixWithCreator[] }) {
  return (
    <div className="flex flex-col gap-2">
      {mixes.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 rounded-default border border-root-line p-3"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-bone">{m.title}</p>
            <div className="mt-1 flex gap-2">
              <Badge variant="outline" className="text-[10px]">
                {m.platform}
              </Badge>
              {m.genres?.slice(0, 2).map((g) => (
                <Badge key={g} variant="secondary" className="text-[10px]">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
