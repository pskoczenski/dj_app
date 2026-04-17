import type { ProfileType } from "@/types";

export const PROFILE_TYPE_OPTIONS: { value: ProfileType; label: string }[] = [
  { value: "dj", label: "DJ" },
  { value: "promoter", label: "Promoter" },
  { value: "venue", label: "Venue" },
  { value: "producer", label: "Producer" },
  { value: "fan", label: "Fan" },
];

export function isProfileType(value: string | undefined): value is ProfileType {
  return PROFILE_TYPE_OPTIONS.some((option) => option.value === value);
}

export function getProfileTypeLabel(type: ProfileType): string {
  return PROFILE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
