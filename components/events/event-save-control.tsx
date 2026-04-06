"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { eventSavesService } from "@/lib/services/event-saves";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type EventSaveControlProps = {
  eventId: string;
  savesCount: number;
  savedByMe?: boolean;
  currentUserId?: string | null;
  onSaveChange?: (next: { saved: boolean; savesCount: number }) => void;
  className?: string;
  variant?: "footer" | "inline";
};

export function EventSaveControl({
  eventId,
  savesCount: initialCount,
  savedByMe = false,
  currentUserId = null,
  onSaveChange,
  className,
  variant = "inline",
}: EventSaveControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(savedByMe);
  const [savesCount, setSavesCount] = useState(initialCount);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    setSaved(savedByMe);
  }, [savedByMe, eventId]);

  useEffect(() => {
    setSavesCount(initialCount);
  }, [initialCount, eventId]);

  async function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const wasSaved = saved;
    const prevCount = savesCount;
    setSavePending(true);
    setSaved(!wasSaved);
    setSavesCount((c) => (wasSaved ? Math.max(0, c - 1) : c + 1));
    try {
      const next = await eventSavesService.toggleSave(eventId, currentUserId);
      setSaved(next.saved);
      setSavesCount(next.savesCount);
      onSaveChange?.(next);
    } catch {
      setSaved(wasSaved);
      setSavesCount(prevCount);
      toast.error("Couldn't update save. Try again.");
    } finally {
      setSavePending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => void handleSaveClick(e)}
      disabled={savePending}
      aria-pressed={saved}
      aria-label={saved ? "Unsave this event" : "Save this event"}
      className={cn(
        "flex items-center gap-0.5 rounded-default px-1.5 py-1 text-fog transition-colors hover:bg-forest-shadow/80 hover:text-bone disabled:opacity-50",
        variant === "footer" && "text-bone/90",
        className,
      )}
    >
      <Bookmark
        className={cn(
          "size-4 shrink-0 transition-colors",
          saved
            ? "fill-mb-turquoise-pale text-mb-turquoise-pale"
            : "fill-transparent text-fog",
        )}
        strokeWidth={saved ? 0 : 2}
        aria-hidden
      />
      <span className="text-xs tabular-nums text-bone">{savesCount}</span>
    </button>
  );
}
