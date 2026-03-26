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
import { mixesService, type MixFilters } from "@/lib/services/mixes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebounce } from "@/hooks/use-debounce";
import { useLikedMixIds } from "@/hooks/use-liked-mix-ids";
import { MixCard } from "@/components/mixes/mix-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import type { MixWithCreator } from "@/types";

const PAGE_SIZE = 12;

export default function MixesPage() {
  return (
    <Suspense>
      <MixesBrowser />
    </Suspense>
  );
}

function MixesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useCurrentUser();

  const [mixes, setMixes] = useState<MixWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [genreFilter, setGenreFilter] = useState(searchParams.get("genre") ?? "");
  const [platformFilter, setPlatformFilter] = useState(searchParams.get("platform") ?? "");
  const [sort, setSort] = useState<MixFilters["sort"]>(
    (searchParams.get("sort") as MixFilters["sort"]) ?? "newest",
  );
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const mixIds = useMemo(() => mixes.map((m) => m.id), [mixes]);
  const serverLikedIds = useLikedMixIds(mixIds, currentUser?.id);
  const mixesListKey = mixIds.join(",");
  const [optimisticLiked, setOptimisticLiked] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setOptimisticLiked({});
  }, [mixesListKey]);

  const likedByMe = useCallback(
    (mixId: string) =>
      Object.hasOwn(optimisticLiked, mixId)
        ? optimisticLiked[mixId]
        : serverLikedIds.has(mixId),
    [optimisticLiked, serverLikedIds],
  );

  function buildFilters(): MixFilters {
    const filters: MixFilters = { sort };
    if (genreFilter) filters.genre = genreFilter;
    if (platformFilter) filters.platform = platformFilter as MixFilters["platform"];
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

        const data = await mixesService.getAll(filters);

        const filtered = debouncedSearch
          ? data.filter(
              (m) =>
                m.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                m.description?.toLowerCase().includes(debouncedSearch.toLowerCase()),
            )
          : data;

        if (append) {
          setMixes((prev) => [...prev, ...filtered]);
        } else {
          setMixes(filtered);
        }
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        // Non-fatal for browse
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, genreFilter, platformFilter, sort],
  );

  useEffect(() => {
    pageRef.current = 0;
    setHasMore(true);
    setExpandedId(null);
    fetchPage(0, false);
  }, [fetchPage]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (genreFilter) params.set("genre", genreFilter);
    if (platformFilter) params.set("platform", platformFilter);
    if (sort && sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    router.replace(`/mixes${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, genreFilter, platformFilter, sort, router]);

  // Infinite scroll
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

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-bone">Mixes</h1>
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
          placeholder="Search mixes by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Search mixes"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Genre"
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="w-40"
            aria-label="Filter by genre"
          />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-default border border-root-line bg-deep-loam px-3 py-2 text-sm text-bone"
            aria-label="Filter by platform"
          >
            <option value="">All Platforms</option>
            <option value="soundcloud">SoundCloud</option>
            <option value="mixcloud">Mixcloud</option>
            <option value="youtube">YouTube</option>
            <option value="spotify">Spotify</option>
            <option value="apple_music">Apple Music</option>
            <option value="other">Other</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as MixFilters["sort"])}
            className="rounded-default border border-root-line bg-deep-loam px-3 py-2 text-sm text-bone"
            aria-label="Sort mixes"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : mixes.length === 0 ? (
        <EmptyState
          title="No mixes found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {mixes.map((mix) => (
            <MixCard
              key={mix.id}
              mix={mix}
              expanded={expandedId === mix.id}
              onToggle={() => toggleExpand(mix.id)}
              likedByMe={likedByMe(mix.id)}
              currentUserId={currentUser?.id ?? null}
              onLikeChange={(next) => {
                setMixes((prev) =>
                  prev.map((m) =>
                    m.id === mix.id ? { ...m, likes_count: next.likesCount } : m,
                  ),
                );
                setOptimisticLiked((prev) => ({
                  ...prev,
                  [mix.id]: next.liked,
                }));
              }}
            />
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
