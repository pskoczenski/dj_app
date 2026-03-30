"use client";

import { MapPin } from "lucide-react";
import { useLocation } from "@/hooks/use-location";
import { LocationPickerPopover } from "@/components/layout/location-picker-popover";
import { cn } from "@/lib/utils";

type LocationIndicatorProps = {
  className?: string;
};

export function LocationIndicator({ className }: LocationIndicatorProps) {
  const { activeCity, isExploring } = useLocation();

  return (
    <LocationPickerPopover
      triggerClassName={className}
      trigger={
        <>
          <span
            className="inline-flex shrink-0"
            title={
              isExploring
                ? "Exploring another city — open to switch or go home"
                : undefined
            }
          >
            <MapPin
              className={cn(
                "size-4",
                isExploring ? "text-lichen-gold" : "text-stone",
              )}
              aria-hidden
            />
          </span>
          <span
            className={cn(
              "hidden max-w-[10rem] truncate md:inline",
              isExploring && "font-medium text-lichen-gold",
            )}
          >
            {activeCity.name}, {activeCity.state_code}
          </span>
          {isExploring ? (
            <>
              <span
                className="hidden size-2 shrink-0 rounded-full bg-lichen-gold md:inline"
                aria-hidden
              />
              <span className="sr-only">Exploring outside your home city.</span>
            </>
          ) : null}
        </>
      }
    />
  );
}
