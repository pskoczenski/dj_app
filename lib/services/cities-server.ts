import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/db/schema-constants";
import type { City } from "@/types";

const CITY_SELECT = "id, name, state_name, state_code, created_at";

/** Single-city fetch for Server Components / route handlers (RLS applies). */
export async function getById(id: string): Promise<City | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from(TABLES.cities)
    .select(CITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as City | null;
}

export const citiesServerService = {
  getById,
};
