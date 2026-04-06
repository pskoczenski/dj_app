"use client";

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
            className={cn(
              "size-1.5 shrink-0 rounded-full bg-mb-turquoise-pale",
              isExploring && "bg-mb-turquoise-mid",
            )}
            title={
              isExploring
                ? "Exploring another city — open to switch or go home"
                : undefined
            }
            aria-hidden
          />
          <span
            className={cn(
              "max-w-[7rem] truncate sm:max-w-[10rem] md:max-w-[12rem]",
              isExploring && "font-medium text-mb-turquoise-pale",
            )}
          >
            {activeCity.name}, {activeCity.state_code}
          </span>
          {isExploring ? (
            <span className="sr-only">Exploring outside your home city.</span>
          ) : null}
        </>
      }
    />
  );
}
