"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { profilesService } from "@/lib/services/profiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, X, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { Profile } from "@/types";

export interface LineupEntry {
  tempId: string;
  profileId: string;
  displayName: string;
  slug: string;
  profileImageUrl: string | null;
  isHeadliner: boolean;
  setTime: string;
  sortOrder: number;
}

interface LineupBuilderProps {
  value: LineupEntry[];
  onChange: (entries: LineupEntry[]) => void;
  currentUserId?: string;
}

let nextTempId = 1;
function makeTempId() {
  return `tmp-${nextTempId++}`;
}

export function LineupBuilder({
  value,
  onChange,
  currentUserId,
}: LineupBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    profilesService.search(debouncedQuery).then((data) => {
      if (!cancelled) {
        const existingIds = new Set(value.map((e) => e.profileId));
        setResults(data.filter((p) => !existingIds.has(p.id)));
        setSearching(false);
        setShowResults(true);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addProfile(profile: Profile) {
    const entry: LineupEntry = {
      tempId: makeTempId(),
      profileId: profile.id,
      displayName: profile.display_name,
      slug: profile.slug,
      profileImageUrl: profile.profile_image_url,
      isHeadliner: false,
      setTime: "",
      sortOrder: value.length,
    };
    onChange([...value, entry]);
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
  }

  const addSelf = useCallback(() => {
    if (!currentUserId || value.some((e) => e.profileId === currentUserId)) return;
    profilesService.getById(currentUserId).then((p) => {
      if (!p) return;
      addProfile(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, value]);

  function removeEntry(tempId: string) {
    onChange(value.filter((e) => e.tempId !== tempId).map((e, i) => ({ ...e, sortOrder: i })));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...value];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next.map((e, i) => ({ ...e, sortOrder: i })));
  }

  function moveDown(index: number) {
    if (index >= value.length - 1) return;
    const next = [...value];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next.map((e, i) => ({ ...e, sortOrder: i })));
  }

  function updateEntry(tempId: string, updates: Partial<LineupEntry>) {
    onChange(value.map((e) => (e.tempId === tempId ? { ...e, ...updates } : e)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-bone">Lineup</label>
        {currentUserId && !value.some((e) => e.profileId === currentUserId) && (
          <Button type="button" variant="ghost" size="sm" onClick={addSelf}>
            + Add Myself
          </Button>
        )}
      </div>

      {/* Search */}
      <div ref={containerRef} className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fog" />
        <Input
          placeholder="Search DJs by name or slug…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pl-10"
          aria-label="Search DJs"
        />
        {showResults && results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-default border border-root-line bg-deep-loam shadow-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProfile(p)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-bone hover:bg-root-line/30"
                >
                  <span className="font-medium">{p.display_name}</span>
                  <span className="text-fog">@{p.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fog">
            Searching…
          </span>
        )}
      </div>

      {/* Lineup rows */}
      {value.length === 0 ? (
        <p className="py-4 text-center text-sm text-fog">No DJs added yet.</p>
      ) : (
        <ul className="flex flex-col gap-2" role="list" aria-label="Lineup entries">
          {value.map((entry, index) => (
            <li
              key={entry.tempId}
              className="flex items-center gap-3 rounded-default border border-root-line p-3"
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-fog hover:text-bone disabled:opacity-30"
                  aria-label={`Move ${entry.displayName} up`}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === value.length - 1}
                  className="text-fog hover:text-bone disabled:opacity-30"
                  aria-label={`Move ${entry.displayName} down`}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-bone">
                    {entry.displayName}
                  </span>
                  {entry.isHeadliner && (
                    <Badge variant="default" className="text-[10px]">
                      Headliner
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-stone">
                    <Checkbox
                      checked={entry.isHeadliner}
                      onCheckedChange={(v) =>
                        updateEntry(entry.tempId, { isHeadliner: !!v })
                      }
                    />
                    Headliner
                  </label>
                  <Input
                    placeholder="Set time"
                    value={entry.setTime}
                    onChange={(e) =>
                      updateEntry(entry.tempId, { setTime: e.target.value })
                    }
                    className="h-7 w-28 text-xs"
                    aria-label={`Set time for ${entry.displayName}`}
                  />
                </div>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeEntry(entry.tempId)}
                className="text-fog hover:text-dried-blood"
                aria-label={`Remove ${entry.displayName}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
