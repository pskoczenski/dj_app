import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { City } from "@/types";

function supabase() {
  return createClient();
}

/** All cities for form pickers (ordered for &lt;select&gt;; Step 31 replaces with autocomplete). */
export async function listAll(): Promise<City[]> {
  const { data, error } = await supabase()
    .from(TABLES.cities)
    .select("id, name, state_name, state_code, created_at")
    .order("state_code", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as City[];
}

export async function getById(id: string): Promise<City | null> {
  const { data, error } = await supabase()
    .from(TABLES.cities)
    .select("id, name, state_name, state_code, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as City | null;
}

export const citiesService = {
  listAll,
  getById,
};
