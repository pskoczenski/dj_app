import { AlertTriangle } from "lucide-react";

export function CancelledBanner() {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-default border border-dried-blood/40 bg-dried-blood/10 px-4 py-3 text-sm font-medium text-dried-blood"
    >
      <AlertTriangle className="size-4 shrink-0" />
      This event has been cancelled.
    </div>
  );
}
