import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { City } from "@/types";

function supabase() {
  return createClient();
}

const CITY_SELECT = "id, name, state_name, state_code, created_at";

/** Escape `%` and `_` for ILIKE patterns (PostgREST / Postgres LIKE). */
export function escapeIlikePattern(fragment: string): string {
  return fragment.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** All cities for form pickers or admin tooling (ordered for &lt;select&gt;). */
export async function listAll(): Promise<City[]> {
  const { data, error } = await supabase()
    .from(TABLES.cities)
    .select(CITY_SELECT)
    .order("state_code", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as City[];
}

/**
 * Prefix `ILIKE` first; if no rows, substring match with prefix-first ordering.
 * Default limit 10.
 */
export async function search(
  query: string,
  options: { limit?: number } = {},
): Promise<City[]> {
  const limit = options.limit ?? 10;
  const raw = query.trim();
  if (raw.length < 2) return [];

  const esc = escapeIlikePattern(raw);
  const sb = supabase();
  const lower = raw.toLowerCase();

  const prefixRes = await sb
    .from(TABLES.cities)
    .select(CITY_SELECT)
    .ilike("name", `${esc}%`)
    .order("name", { ascending: true })
    .order("state_code", { ascending: true })
    .limit(limit);

  if (prefixRes.error) throw prefixRes.error;
  const prefixRows = (prefixRes.data ?? []) as City[];
  if (prefixRows.length > 0) return prefixRows;

  const subRes = await sb
    .from(TABLES.cities)
    .select(CITY_SELECT)
    .ilike("name", `%${esc}%`)
    .limit(Math.min(50, limit * 5));

  if (subRes.error) throw subRes.error;
  const rows = (subRes.data ?? []) as City[];
  return [...rows]
    .sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bp = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const nc = a.name.localeCompare(b.name);
      if (nc !== 0) return nc;
      return a.state_code.localeCompare(b.state_code);
    })
    .slice(0, limit);
}

export async function getById(id: string): Promise<City | null> {
  const { data, error } = await supabase()
    .from(TABLES.cities)
    .select(CITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as City | null;
}

export const citiesService = {
  listAll,
  search,
  getById,
};
