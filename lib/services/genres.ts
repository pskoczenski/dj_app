import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { Genre } from "@/types";

function supabase() {
  return createClient();
}

/** Map a user-typed label to seed-data slugs (e.g. "Deep House" → "deep-house"). */
export function labelToSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve freeform genre labels from forms to `genres.id` values. Unknown labels are skipped. */
export async function resolveLabelsToIds(labels: string[]): Promise<string[]> {
  const normalized = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
  if (normalized.length === 0) return [];

  const { data: all, error } = await supabase()
    .from(TABLES.genres)
    .select("id, slug, name");

  if (error) throw error;

  const bySlug = new Map((all ?? []).map((g) => [g.slug, g.id] as const));
  const byNameLower = new Map(
    (all ?? []).map((g) => [g.name.toLowerCase(), g.id] as const),
  );

  const ids: string[] = [];
  for (const label of normalized) {
    const slug = labelToSlug(label);
    const id =
      bySlug.get(slug) ?? byNameLower.get(label.toLowerCase()) ?? null;
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

/** Map a browse filter token (e.g. "techno", "house") to a single genre id. */
export async function resolveFilterTokenToId(
  token: string,
): Promise<string | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const { data: all, error } = await supabase()
    .from(TABLES.genres)
    .select("id, slug, name");
  if (error) throw error;
  const slug = labelToSlug(trimmed);
  for (const g of all ?? []) {
    if (g.slug === slug || g.name.toLowerCase() === trimmed.toLowerCase()) {
      return g.id;
    }
  }
  return null;
}

export async function getIdToNameMap(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase()
    .from(TABLES.genres)
    .select("id, name")
    .in("id", unique);

  if (error) throw error;
  return new Map((data ?? []).map((g) => [g.id, g.name] as const));
}

export async function getAll(): Promise<Genre[]> {
  const { data, error } = await supabase()
    .from(TABLES.genres)
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Genre[];
}

function notInIds<Q extends { not: (col: string, op: string, val: string) => Q }>(query: Q, ids: string[]): Q {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return query;
  // PostgREST expects `in.(a,b,c)` format; Supabase `.not("id","in", "(...)" )`
  // works for UUID arrays.
  return query.not("id", "in", `(${unique.join(",")})`);
}

export async function search(
  query: string,
  options: { limit?: number; excludeIds?: string[] } = {},
): Promise<Genre[]> {
  const q = query.trim();
  if (!q) return [];
  const limit = options.limit ?? 15;
  const excludeIds = options.excludeIds ?? [];

  // Prefix-first query, then (if needed) substring fallback.
  const prefixQuery = notInIds(
    supabase()
      .from(TABLES.genres)
      .select("id, slug, name")
      .ilike("name", `${q}%`)
      .order("name", { ascending: true })
      .limit(limit),
    excludeIds,
  );

  const { data: prefix, error: prefixError } = await prefixQuery;
  if (prefixError) throw prefixError;
  const prefixRows = (prefix ?? []) as Genre[];
  if (prefixRows.length >= limit) return prefixRows;

  const already = new Set(prefixRows.map((g) => g.id));
  const remaining = limit - prefixRows.length;

  const fallbackQuery = notInIds(
    supabase()
      .from(TABLES.genres)
      .select("id, slug, name")
      .ilike("name", `%${q}%`)
      .order("name", { ascending: true })
      .limit(remaining),
    [...excludeIds, ...already],
  );

  const { data: fallback, error: fallbackError } = await fallbackQuery;
  if (fallbackError) throw fallbackError;

  return [...prefixRows, ...((fallback ?? []) as Genre[])];
}

/**
 * Ensures every id exists in `genres` (compensates for no FK on `genre_ids` arrays).
 * Call before writes that persist `genre_ids` on profiles, events, or mixes.
 */
export async function ensureGenreIdsExist(
  genreIds: string[] | null | undefined,
): Promise<void> {
  const unique = [...new Set((genreIds ?? []).filter(Boolean))];
  if (unique.length === 0) return;

  const { data, error } = await supabase()
    .from(TABLES.genres)
    .select("id")
    .in("id", unique);

  if (error) throw error;

  const found = new Set((data ?? []).map((r) => r.id));
  const missing = unique.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Unknown genre id(s): ${missing.join(", ")}. Each id must exist in the genres table.`,
    );
  }
}

export async function getByIds(genreIds: string[]): Promise<Genre[]> {
  const ids = [...new Set(genreIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const { data, error } = await supabase()
    .from(TABLES.genres)
    .select("id, slug, name")
    .in("id", ids);

  if (error) throw error;
  const rows = (data ?? []) as Genre[];
  const byId = new Map(rows.map((g) => [g.id, g] as const));
  return genreIds.map((id) => byId.get(id)).filter((g): g is Genre => Boolean(g));
}

/** Attach `genres: string[]` display labels from `genre_ids` for each row. */
export async function hydrateGenreLabels<T extends { genre_ids?: string[] | null }>(
  rows: T[],
): Promise<(T & { genres: string[] })[]> {
  const ids = [...new Set(rows.flatMap((r) => r.genre_ids ?? []))];
  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, genres: [] as string[] }));
  }
  const map = await getIdToNameMap(ids);
  return rows.map((r) => ({
    ...r,
    genres: (r.genre_ids ?? [])
      .map((id) => map.get(id))
      .filter((x): x is string => Boolean(x)),
  }));
}

export const genresService = {
  labelToSlug,
  search,
  getAll,
  getByIds,
  ensureGenreIdsExist,
  resolveLabelsToIds,
  resolveFilterTokenToId,
  getIdToNameMap,
  hydrateGenreLabels,
};
