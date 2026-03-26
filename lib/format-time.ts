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
