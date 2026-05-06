"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { blocksService } from "@/lib/services/blocks";
import { Button } from "@/components/ui/button";

export function BlockUserButton({
  blockedId,
  size = "sm",
}: {
  blockedId: string;
  size?: "sm" | "default";
}) {
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const status = await blocksService.getBlockStatus(blockedId);
        if (!cancelled) setBlockedByMe(status.blockedByMe);
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blockedId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (blockedByMe) {
        await blocksService.unblockUser(blockedId);
        setBlockedByMe(false);
        toast.success("User unblocked.");
      } else {
        await blocksService.blockUser(blockedId);
        setBlockedByMe(true);
        toast.success("User blocked.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update block.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={blockedByMe ? "outline" : "destructive"}
      size={size}
      onClick={toggle}
      disabled={loading}
    >
      {blockedByMe ? "Unblock" : "Block"}
    </Button>
  );
}

