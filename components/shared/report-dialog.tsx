"use client";

import { cloneElement, isValidElement, useMemo, useState } from "react";
import { toast } from "sonner";
import { reportsService, type ReportReason, type ReportSubjectType } from "@/lib/services/reports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate" },
  { value: "impersonation", label: "Impersonation" },
  { value: "illegal", label: "Illegal content" },
  { value: "copyright", label: "Copyright" },
  { value: "other", label: "Other" },
];

export function ReportDialog({
  subjectType,
  subjectId,
  trigger,
  title = "Report",
  description = "Help us keep Mirrorball safe. Choose a reason and optionally add a note.",
}: {
  subjectType: ReportSubjectType;
  subjectId: string;
  trigger: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasonOptions = useMemo(() => REASONS, []);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportsService.createReport({
        subjectType,
        subjectId,
        reason,
        note,
      });
      toast.success("Report submitted. Thank you.");
      setOpen(false);
      setNote("");
      setReason("spam");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isValidElement(trigger) ? (
        cloneElement(trigger, {
          onClick: (e) => {
            (trigger.props as { onClick?: (evt: unknown) => void } | undefined)?.onClick?.(e);
            setOpen(true);
          },
        })
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          {trigger}
        </button>
      )}

      <DialogContent className="sm:max-w-md pr-10 pt-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone" htmlFor="report-reason">
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className={cn(
                "h-11 w-full rounded-default border border-root-line bg-dark-moss px-3 text-sm text-bone",
                "transition-colors outline-none hover:border-sage-edge focus-visible:border-fern focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
              disabled={submitting}
            >
              {reasonOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone" htmlFor="report-note">
              Note (optional)
            </label>
            <Textarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else you want to share?"
              maxLength={2000}
              disabled={submitting}
              className="text-sm text-stone"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

