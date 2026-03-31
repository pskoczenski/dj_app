import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";

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
  resolveLabelsToIds,
  resolveFilterTokenToId,
  getIdToNameMap,
  hydrateGenreLabels,
};
