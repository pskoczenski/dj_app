import { createClient } from "@/lib/supabase/client";

/**
 * Minimal ASCII slugify — lowercase, strip non-alphanumeric,
 * collapse hyphens, trim edges.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Check whether a slug already exists in the profiles table.
 */
async function slugExists(slug: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data !== null;
}

/**
 * Generate a unique slug from a display name.
 * Appends an incrementing counter if the base slug is taken.
 */
export async function generateUniqueSlug(displayName: string): Promise<string> {
  const base = slugify(displayName);
  if (!base) return `user-${Date.now()}`;

  let slug = base;
  let counter = 1;

  while (await slugExists(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
