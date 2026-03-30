"use client";

import { useLocationContext } from "@/lib/location/location-provider";
import type { LocationContextValue } from "@/lib/location/types";

export function useLocation(): LocationContextValue {
  const context = useLocationContext();
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}
