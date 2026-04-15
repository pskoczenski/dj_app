"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { messagesService } from "@/lib/services/messages";
import { conversationsService } from "@/lib/services/conversations";

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function QuickMessageDialog({
  recipientId,
  recipientName,
  recipientImageUrl,
  trigger,
}: {
  recipientId: string;
  recipientName: string;
  recipientImageUrl?: string | null;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = body.length;
  const guidanceMax = 1000;

  const trimmed = useMemo(() => body.trim(), [body]);
  const canSend = Boolean(trimmed) && !pending;

  useEffect(() => {
    if (!open) return;
    // next tick after dialog content mounts
    const t = window.setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  function resetDraft() {
    setBody("");
    setError(null);
    setPending(false);
  }

  async function send() {
    if (!canSend) return;
    const content = trimmed;

    setPending(true);
    setError(null);
    try {
      const conversationId = await conversationsService.getOrCreateDM(recipientId);
      await messagesService.send(conversationId, content);
      toast.success(`Message sent to ${recipientName}`);
      setOpen(false);
      resetDraft();
    } catch {
      const msg = "Failed to send message. Please try again.";
      setError(msg);
      toast.error(msg);
      // Keep dialog open and preserve draft on error.
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetDraft();
        }
      }}
    >
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-bone">
            Message {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {recipientImageUrl ? (
              <AvatarImage src={recipientImageUrl} alt={recipientName} />
            ) : null}
            <AvatarFallback className="text-xs">
              {initialsFromName(recipientName)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Textarea
            ref={textAreaRef}
            aria-label="Message body"
            placeholder="Write a message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="max-h-44 resize-none"
            onKeyDown={(e) => {
              const isModEnter = (e.ctrlKey || e.metaKey) && e.key === "Enter";
              if (!isModEnter) return;
              e.preventDefault();
              void send();
            }}
          />
          <div className="flex items-center justify-between text-[10px] text-fog">
            <span aria-hidden>
              {charCount} / {guidanceMax}
            </span>
            {error ? (
              <span role="alert" className="text-dried-blood">
                {error}
              </span>
            ) : (
              <span aria-hidden />
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            }
          />

          <Button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
          >
            {pending ? <LoadingSpinner size="sm" /> : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

