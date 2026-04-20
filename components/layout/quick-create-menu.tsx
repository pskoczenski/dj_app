"use client";

import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarPlus, Music } from "lucide-react";
import { Plus } from "lucide-react";

export function QuickCreateMenu() {
  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Quick create"
        data-ftue="ftue-quick-create"
        className="flex size-10 items-center justify-center rounded-full bg-fern text-bone transition-colors hover:bg-living-fern"
      >
        <Plus className="size-5" />
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={8} className="w-48 p-1">
        <button
          type="button"
          onClick={() => router.push("/events/create")}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-bone hover:bg-forest-shadow"
        >
          <CalendarPlus className="size-4" />
          Create Event
        </button>
        <button
          type="button"
          onClick={() => router.push("/profile/edit#mixes")}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-bone hover:bg-forest-shadow"
        >
          <Music className="size-4" />
          Add Mix
        </button>
      </PopoverContent>
    </Popover>
  );
}
