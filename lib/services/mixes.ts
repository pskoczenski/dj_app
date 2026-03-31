import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import { genresService } from "@/lib/services/genres";
import type {
  Mix,
  MixInsert,
  MixUpdate,
  MixPlatform,
  MixWithCreator,
} from "@/types";

/** Shared select for mix list/search rows with embedded DJ profile. */
export const MIX_LIST_SELECT = `
  *,
  creator:profiles!mixes_profile_id_fkey (
    display_name,
    slug
  )
`;

export interface MixFilters {
  profileId?: string;
  platform?: MixPlatform;
  genre?: string;
  sort?: "newest" | "oldest" | "order";
  range?: [number, number];
}

function supabase() {
  return createClient();
}

export async function getAll(
  filters: MixFilters = {},
): Promise<MixWithCreator[]> {
  let genreFilterId: string | null = null;
  if (filters.genre) {
    genreFilterId = await genresService.resolveFilterTokenToId(filters.genre);
    if (!genreFilterId) return [];
  }

  let query = supabase()
    .from(TABLES.mixes)
    .select(MIX_LIST_SELECT)
    .is("deleted_at", null);

  if (filters.profileId) {
    query = query.eq("profile_id", filters.profileId);
  }
  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }
  if (genreFilterId) {
    query = query.contains("genre_ids", [genreFilterId]);
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "order":
      query = query.order("sort_order", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  if (filters.range) {
    query = query.range(filters.range[0], filters.range[1]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return genresService.hydrateGenreLabels((data ?? []) as MixWithCreator[]);
}

export async function getByProfile(
  profileId: string,
): Promise<MixWithCreator[]> {
  return getAll({ profileId, sort: "order" });
}

export async function getById(id: string): Promise<Mix | null> {
  const { data, error } = await supabase()
    .from(TABLES.mixes)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const [m] = await genresService.hydrateGenreLabels([data as Mix]);
  return m as Mix;
}

export async function create(data: MixInsert): Promise<Mix> {
  const { data: created, error } = await supabase()
    .from(TABLES.mixes)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  const [m] = await genresService.hydrateGenreLabels([created as Mix]);
  return m as Mix;
}

export async function update(id: string, data: MixUpdate): Promise<Mix> {
  const { data: updated, error } = await supabase()
    .from(TABLES.mixes)
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  const [m] = await genresService.hydrateGenreLabels([updated as Mix]);
  return m as Mix;
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await supabase()
    .from(TABLES.mixes)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function reorder(
  profileId: string,
  orderedIds: string[],
): Promise<void> {
  const client = supabase();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await client
      .from(TABLES.mixes)
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("profile_id", profileId);

    if (error) throw error;
  }
}

export const mixesService = {
  getAll,
  getByProfile,
  getById,
  create,
  update,
  softDelete,
  /** Alias for soft-delete (public mixes API). */
  delete: softDelete,
  reorder,
};
