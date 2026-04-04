/** Postgres `time` values (e.g. `22:00:00`) → `HH:MM` for `<input type="time" />`. */
export function formatSetTimeForInput(
  value: string | null | undefined,
): string {
  if (value == null || value === "") return "";
  const t = value.trim();
  return t.length >= 5 ? t.slice(0, 5) : t;
}
