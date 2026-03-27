"use client";

import {
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CommentList } from "@/components/comments/CommentList";
import { useComments } from "@/hooks/use-comments";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { CommentableType } from "@/types";

function CommentSkeletonRows() {
  return (
    <div className="flex flex-col gap-3 py-1" aria-hidden>
      {["a", "b", "c"].map((k) => (
        <div key={k} className="flex gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentsModalBody({
  commentableType,
  commentableId,
  title,
}: {
  commentableType: CommentableType;
  commentableId: string;
  title: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const { user } = useCurrentUser();
  const readOnly = !user?.id;

  const trimmed = useMemo(() => draft.trim(), [draft]);
  const canPost = Boolean(trimmed) && !posting && !readOnly;

  const {
    comments,
    totalCount,
    loading,
    hasMore,
    loadMore,
    addComment,
    deleteComment,
  } = useComments(commentableType, commentableId);

  async function handlePost() {
    if (!canPost) return;
    const body = trimmed;
    setPosting(true);
    try {
      await addComment(body);
      setDraft("");
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // `useComments.addComment` already toasts on failure.
    } finally {
      setPosting(false);
    }
  }

  const subtitle =
    totalCount === 1 ? "1 comment" : `${totalCount} comments`;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-bone">{title}</DialogTitle>
        <p className="text-sm text-fog">{subtitle}</p>
      </DialogHeader>

      <div
        ref={scrollRef}
        className="max-h-[min(48vh,28rem)] overflow-y-auto pr-1"
      >
        {loading ? (
          <CommentSkeletonRows />
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone">
            No comments yet — be the first!
          </p>
        ) : (
          <CommentList
            comments={comments}
            currentUserId={user?.id ?? null}
            onDelete={(id) => void deleteComment(id)}
            onLoadMore={() => void loadMore()}
            hasMore={hasMore}
            readOnly={readOnly}
          />
        )}
      </div>

      <div className="border-t border-root-line pt-3">
        {readOnly ? (
          <p className="text-center text-xs text-fog">Sign in to comment.</p>
        ) : (
          <>
            <Textarea
              placeholder="Add a comment..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={5000}
              className="max-h-24 min-h-[2.5rem] resize-y"
              disabled={posting}
              onKeyDown={(e) => {
                const mod = e.ctrlKey || e.metaKey;
                if (mod && e.key === "Enter") {
                  e.preventDefault();
                  void handlePost();
                }
              }}
              aria-label="Comment text"
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={!canPost}
                onClick={() => void handlePost()}
              >
                {posting ? <LoadingSpinner size="sm" /> : "Post"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function CommentsModal({
  commentableType,
  commentableId,
  title,
  trigger,
}: {
  commentableType: CommentableType;
  commentableId: string;
  title: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const triggerRender: ReactElement = isValidElement(trigger)
    ? (trigger as ReactElement)
    : <button type="button">{trigger}</button>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender} />
      <DialogContent
        showCloseButton
        className="flex max-h-[min(80vh,40rem)] w-full max-w-lg flex-col gap-3 sm:max-w-lg"
      >
        {open ? (
          /** Fetch comments only after open — `useComments` runs inside body */
          <CommentsModalBody
            commentableType={commentableType}
            commentableId={commentableId}
            title={title}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
