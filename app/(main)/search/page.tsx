"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { searchService } from "@/lib/services/search";
import { EventCard } from "@/components/events/event-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search as SearchIcon } from "lucide-react";
import type { Profile, EventWithLineupPreview, MixWithCreator } from "@/types";

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

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setDjs([]);
      setEvents([]);
      setMixes([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const [d, e, m] = await Promise.all([
        searchService.searchDjs(q),
        searchService.searchEvents(q),
        searchService.searchMixes(q),
      ]);
      setDjs(d);
      setEvents(e);
      setMixes(m);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tab !== "all") params.set("tab", tab);
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [query, tab, router]);

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
            title="No results"
            description={`Nothing matched "${debouncedQuery}". Try a different search.`}
          />
        ) : (
          <>
            {/* All tab */}
            <TabsContent value="all">
              <div className="flex flex-col gap-8">
                {djs.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold text-bone">
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
                      <h2 className="font-display text-lg font-bold text-bone">
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
                        <EventCard key={e.id} event={e} />
                      ))}
                    </div>
                  </section>
                )}
                {mixes.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold text-bone">
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
              <h2 className="mb-3 font-display text-lg font-bold text-bone">
                DJs
              </h2>
              {djs.length > 0 ? (
                <DjResultsList profiles={djs} />
              ) : (
                <EmptyState title="No DJs found" description="" />
              )}
            </TabsContent>

            {/* Events tab */}
            <TabsContent value="events">
              <h2 className="mb-3 font-display text-lg font-bold text-bone">
                Events
              </h2>
              {events.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No events found" description="" />
              )}
            </TabsContent>

            {/* Mixes tab */}
            <TabsContent value="mixes">
              <h2 className="mb-3 font-display text-lg font-bold text-bone">
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
            {p.city && (
              <span className="text-xs text-fog">{p.city}{p.state ? `, ${p.state}` : ""}</span>
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
