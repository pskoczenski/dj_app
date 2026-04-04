/** `time` / ISO-like `HH:MM` or `HH:MM:SS` → e.g. `2:30 PM` (en-US). */
export function formatSetTime12h(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?/);
  if (!match) return timeStr;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  if (hour < 0 || hour > 23) return timeStr;
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

/**
 * Lineup “set time” field → Postgres `time`-compatible `HH:MM:SS`.
 * Accepts 24h (`22:30`, `22:30:00`) and 12h (`10:30 PM`, `12:00 am`, `10 pm`).
 * Empty / whitespace → null. Unrecognized → null.
 */
export function parseLineupSetTimeToPostgres(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?\s*$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2];
    const ap = m12[3].toUpperCase();
    const mi = parseInt(min, 10);
    if (h < 1 || h > 12 || mi < 0 || mi > 59) return null;
    const hour24 =
      ap === "A" ? (h === 12 ? 0 : h) : h === 12 ? 12 : h + 12;
    return `${String(hour24).padStart(2, "0")}:${min}:00`;
  }

  const m12h = s.match(/^(\d{1,2})\s*([AaPp])\.?[Mm]\.?\s*$/);
  if (m12h) {
    const h = parseInt(m12h[1], 10);
    const ap = m12h[2].toUpperCase();
    if (h < 1 || h > 12) return null;
    const hour24 =
      ap === "A" ? (h === 12 ? 0 : h) : h === 12 ? 12 : h + 12;
    return `${String(hour24).padStart(2, "0")}:00:00`;
  }

  const m24 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = m24[2];
    const sec = m24[3] ?? "00";
    const mi = parseInt(min, 10);
    const si = parseInt(sec, 10);
    if (h < 0 || h > 23 || mi > 59 || si > 59) return null;
    return `${String(h).padStart(2, "0")}:${min}:${sec.padStart(2, "0")}`;
  }

  return null;
}

/** DB `time` → string shown in lineup set-time text field (12h). */
export function formatSetTimeForLineupField(
  value: string | null | undefined,
): string {
  if (value == null || value === "") return "";
  return formatSetTime12h(value);
}

export class InvalidLineupSetTimeError extends Error {
  constructor() {
    super("Invalid lineup set time");
    this.name = "InvalidLineupSetTimeError";
  }
}
