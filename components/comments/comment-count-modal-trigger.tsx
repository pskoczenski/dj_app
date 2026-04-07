"use client";

import { MessageSquare } from "lucide-react";
import { CommentsModal } from "@/components/comments/CommentsModal";
import { useCommentCount } from "@/hooks/use-comment-count";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CommentableType } from "@/types";

type Variant = "badge" | "detail";

export function CommentCountModalTrigger({
  commentableType,
  commentableId,
  title,
  variant = "badge",
  className,
  stopPropagation = false,
}: {
  commentableType: CommentableType;
  commentableId: string;
  title: string;
  variant?: Variant;
  className?: string;
  /** Set when nested in clickable areas (e.g. mix card) to avoid bubbling. */
  stopPropagation?: boolean;
}) {
  const { count, loading } = useCommentCount(commentableType, commentableId);
  const ariaLabel = count === 0 ? "Add a comment" : `${count} comments`;

  const trigger =
    variant === "detail" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-1.5", className)}
        aria-label={ariaLabel}
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        <MessageSquare className="size-4 shrink-0" />
        {loading ? (
          <Skeleton className="h-4 w-24 rounded-sm" />
        ) : (
          <span>View comments ({count})</span>
        )}
      </Button>
    ) : (
      <button
        type="button"
        className={cn(
          "inline-flex min-w-[4.25rem] items-center justify-center gap-1 rounded-default px-2 py-1 text-sm text-mb-text-tertiary transition-colors hover:bg-mb-surface-3 hover:text-mb-text-primary",
          className,
        )}
        aria-label={ariaLabel}
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        <MessageSquare className="size-4 shrink-0" />
        {loading ? (
          <Skeleton className="h-4 w-7 rounded-sm" aria-hidden />
        ) : (
          <span className="min-w-[1ch] tabular-nums text-mb-text-secondary">
            {count}
          </span>
        )}
      </button>
    );

  return (
    <CommentsModal
      commentableType={commentableType}
      commentableId={commentableId}
      title={title}
      trigger={trigger}
    />
  );
}
