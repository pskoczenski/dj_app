import type { City } from "@/types";

const STORAGE_KEY = "dj_recent_cities";
const MAX_RECENT = 5;

function parseStored(raw: string | null): City[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is City =>
        c !== null &&
        typeof c === "object" &&
        typeof (c as City).id === "string" &&
        typeof (c as City).name === "string" &&
        typeof (c as City).state_code === "string" &&
        typeof (c as City).state_name === "string",
    );
  } catch {
    return [];
  }
}

/** Last cities switched to via the location picker (client only). */
export function readRecentCities(): City[] {
  if (typeof window === "undefined") return [];
  return parseStored(window.localStorage.getItem(STORAGE_KEY));
}

export function addRecentCity(city: City): void {
  if (typeof window === "undefined") return;
  const prev = readRecentCities();
  const next = [city, ...prev.filter((c) => c.id !== city.id)].slice(
    0,
    MAX_RECENT,
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
