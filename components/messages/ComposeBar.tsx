"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ComposeBar({
  onSend,
  sending = false,
  onDraftChange,
}: {
  onSend: (body: string) => Promise<void>;
  sending?: boolean;
  /** Called when the draft text changes (e.g. to broadcast typing activity). */
  onDraftChange?: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  async function submit() {
    if (!trimmed || sending) return;
    await onSend(trimmed);
    setValue("");
  }

  return (
    <div className="sticky bottom-14 z-20 border-t border-root-line bg-dark-moss p-3 md:bottom-0">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          aria-label="Message input"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            onDraftChange?.(v);
          }}
          rows={2}
          placeholder="Type a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={!trimmed || sending}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
