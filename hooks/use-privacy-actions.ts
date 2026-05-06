"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { privacyService } from "@/lib/services/privacy";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function usePrivacyActions() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportMyData = useCallback(async () => {
    setExporting(true);
    try {
      const data = await privacyService.exportMyData();
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(`mirrorball-export-${date}.json`, data);
      toast.success("Export ready.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export data.");
    } finally {
      setExporting(false);
    }
  }, []);

  const deleteMyAccount = useCallback(async () => {
    setDeleting(true);
    try {
      await privacyService.deleteMyAccount();
      toast.success("Account deleted.");
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete account.");
      setDeleting(false);
    }
  }, []);

  return {
    exportMyData,
    deleteMyAccount,
    exporting,
    deleting,
  };
}

