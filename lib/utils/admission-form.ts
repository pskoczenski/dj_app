import type { Admission } from "@/types";

export type AdmissionFormType =
  | "not_specified"
  | "free"
  | "fixed"
  | "sliding_scale"
  | "tiered";

export type TierRow = {
  id: string;
  label: string;
  amount: string;
  until: string;
};

export type AdmissionFormState = {
  admissionType: AdmissionFormType;
  fixedAmount: string;
  scaleMin: string;
  scaleMax: string;
  tiers: TierRow[];
  isTicketed: boolean;
};

/** Decompose a stored Admission value back into form field state. */
export function decomposeAdmission(
  a: Admission | null | undefined,
): Omit<AdmissionFormState, "isTicketed"> {
  const defaultTiers: TierRow[] = [
    { id: "default", label: "", amount: "", until: "" },
  ];

  if (!a) {
    return {
      admissionType: "not_specified",
      fixedAmount: "",
      scaleMin: "",
      scaleMax: "",
      tiers: defaultTiers,
    };
  }

  switch (a.type) {
    case "free":
      return { admissionType: "free", fixedAmount: "", scaleMin: "", scaleMax: "", tiers: defaultTiers };
    case "fixed":
      return { admissionType: "fixed", fixedAmount: String(a.amount), scaleMin: "", scaleMax: "", tiers: defaultTiers };
    case "sliding_scale":
      return { admissionType: "sliding_scale", fixedAmount: "", scaleMin: String(a.min), scaleMax: String(a.max), tiers: defaultTiers };
    case "tiered":
      return {
        admissionType: "tiered",
        fixedAmount: "",
        scaleMin: "",
        scaleMax: "",
        tiers: a.tiers.length
          ? a.tiers.map((t, i) => ({
              id: String(i),
              label: t.label,
              amount: String(t.amount),
              until: t.until ?? "",
            }))
          : defaultTiers,
      };
  }
}

/** Convert form state to the Admission payload for the database. */
export function buildAdmissionPayload(state: {
  admissionType: AdmissionFormType;
  fixedAmount: string;
  scaleMin: string;
  scaleMax: string;
  tiers: TierRow[];
}): Admission | null {
  switch (state.admissionType) {
    case "not_specified":
      return null;
    case "free":
      return { type: "free" };
    case "fixed": {
      const amount = parseFloat(state.fixedAmount);
      if (isNaN(amount) || amount < 0) return null;
      return { type: "fixed", amount };
    }
    case "sliding_scale": {
      const min = parseFloat(state.scaleMin);
      const max = parseFloat(state.scaleMax);
      if (isNaN(min) || isNaN(max)) return null;
      return { type: "sliding_scale", min, max };
    }
    case "tiered": {
      const validTiers = state.tiers
        .map((t) => ({
          label: t.label.trim(),
          amount: parseFloat(t.amount),
          ...(t.until.trim() ? { until: t.until.trim() } : {}),
        }))
        .filter((t) => !isNaN(t.amount));
      if (!validTiers.length) return null;
      return { type: "tiered", tiers: validTiers };
    }
  }
}
