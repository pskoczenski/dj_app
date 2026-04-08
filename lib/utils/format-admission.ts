import type { Admission } from "@/types";

function fmtAmt(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/**
 * Abbreviates a tier label for compact display.
 * Keeps the first word, lowercased. Truncates to 3 chars if the word is longer than 4
 * (e.g. "Advance" → "adv", "Door" → "door", "GA" → "ga").
 */
function abbrevLabel(label: string): string {
  const word = label.trim().split(/\s+/)[0] ?? "";
  const lower = word.toLowerCase();
  return lower.length > 4 ? lower.slice(0, 3) : lower;
}

/**
 * Compact single-line format for cards and preview modals.
 * Returns null when admission is null/undefined or cannot be formatted.
 *
 * Examples:
 *   null                                              → null
 *   { type: 'free' }                                  → "Free"
 *   { type: 'fixed', amount: 20 }                     → "$20"
 *   { type: 'fixed', amount: 12.5 }                   → "$12.50"
 *   { type: 'sliding_scale', min: 10, max: 25 }       → "$10–$25"
 *   { type: 'tiered', tiers: [{ label: 'GA', amount: 25 }] }
 *                                                     → "$25"
 *   { type: 'tiered', tiers: [
 *       { label: 'Advance', amount: 15 },
 *       { label: 'Door', amount: 20 }
 *     ]}                                              → "$15 adv / $20 door"
 */
export function formatAdmissionCompact(
  admission: Admission | null | undefined,
): string | null {
  if (!admission) return null;

  switch (admission.type) {
    case "free":
      return "Free";
    case "fixed":
      return fmtAmt(admission.amount);
    case "sliding_scale":
      return `${fmtAmt(admission.min)}–${fmtAmt(admission.max)}`;
    case "tiered": {
      const { tiers } = admission;
      if (!tiers.length) return null;
      if (tiers.length === 1) return fmtAmt(tiers[0].amount);
      const [a, b] = tiers;
      const aLabel = abbrevLabel(a.label);
      const bLabel = abbrevLabel(b.label);
      const aPart = aLabel ? `${fmtAmt(a.amount)} ${aLabel}` : fmtAmt(a.amount);
      const bPart = bLabel ? `${fmtAmt(b.amount)} ${bLabel}` : fmtAmt(b.amount);
      return `${aPart} / ${bPart}`;
    }
  }
}

/**
 * Full detail format for the event detail page.
 * Returns an array of strings (one per line). Returns [] when admission is null.
 *
 * Tiered example:
 *   [{ label: 'Advance', amount: 15, until: 'before 10pm' }, { label: 'Door', amount: 20 }]
 *   → ["$15 Advance (before 10pm)", "$20 Door"]
 *
 * All other types produce a single-element array using the compact format.
 */
export function formatAdmissionDetail(
  admission: Admission | null | undefined,
): string[] {
  if (!admission) return [];

  if (admission.type === "tiered") {
    return admission.tiers.map((tier) => {
      const label = tier.label.trim();
      const until = tier.until?.trim();
      const parts = [fmtAmt(tier.amount), label, until ? `(${until})` : ""]
        .filter(Boolean)
        .join(" ");
      return parts;
    });
  }

  const compact = formatAdmissionCompact(admission);
  return compact ? [compact] : [];
}
