"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { CommentWithAuthor } from "@/types";
import { CommentLikeButton } from "@/components/comments/CommentLikeButton";
import { ReportDialog } from "@/components/shared/report-dialog";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function showEditedLabel(
  created_at: string | null,
  updated_at: string | null,
): boolean {
  if (!created_at || !updated_at) return false;
  return (
    new Date(updated_at).getTime() - new Date(created_at).getTime() > 1000
  );
}

export function CommentList({
  comments,
  currentUserId,
  onDelete,
  onEdit,
  onLoadMore,
  hasMore,
  readOnly = false,
}: {
  comments: CommentWithAuthor[];
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
  onEdit?: (commentId: string, body: string) => void | Promise<void>;
  onLoadMore?: () => void;
  hasMore: boolean;
  readOnly?: boolean;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editBaseline, setEditBaseline] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  function commitEdit(commentId: string) {
    const trimmed = editDraft.trim();
    const baseline = editBaseline?.trim() ?? "";
    if (!trimmed || savingEdit || !onEdit) return;
    if (trimmed === baseline) {
      setEditingId(null);
      setEditBaseline(null);
      return;
    }
    setSavingEdit(true);
    void (async () => {
      try {
        await onEdit(commentId, trimmed);
        setEditingId(null);
        setEditBaseline(null);
      } catch {
        /* hook toasts */
      } finally {
        setSavingEdit(false);
      }
    })();
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => {
        const name = comment.author?.display_name ?? "Unknown";
        const slug = comment.author?.slug;
        const isMine = Boolean(currentUserId && comment.profile_id === currentUserId);
        const editing = editingId === comment.id;
        const canEdit =
          Boolean(onEdit) && isMine && !readOnly && !comment.id.startsWith("tmp-");
        const canReport = Boolean(currentUserId) && !isMine && !readOnly;

        return (
          <div key={comment.id} className="flex gap-2">
            <div className="shrink-0">
              {slug ? (
                <Link href={`/dj/${slug}`} className="block">
                  <Avatar className="size-8">
                    {comment.author?.profile_image_url ? (
                      <AvatarImage
                        src={comment.author.profile_image_url}
                        alt=""
                      />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="size-8">
                  <AvatarFallback className="text-[10px]">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-bone">
                {slug ? (
                  <Link
                    href={`/dj/${slug}`}
                    className="font-semibold hover:underline"
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="font-semibold">{name}</span>
                )}
                <span className="text-fog">
                  {" "}
                  · {formatRelativeTime(comment.created_at)}
                </span>
                {showEditedLabel(comment.created_at, comment.updated_at) ? (
                  <span className="text-fog"> · edited</span>
                ) : null}
              </p>
              {editing ? (
                <div className="mt-0.5 space-y-2">
                  <Textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={3}
                    maxLength={5000}
                    disabled={savingEdit}
                    className="max-h-32 min-h-[2.5rem] resize-y text-sm text-stone"
                    aria-label="Edit comment"
                    onKeyDown={(e) => {
                      const mod = e.ctrlKey || e.metaKey;
                      if (mod && e.key === "Enter") {
                        e.preventDefault();
                        commitEdit(comment.id);
                      }
                    }}
                  />
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={savingEdit}
                      onClick={() => {
                        setEditingId(null);
                        setEditBaseline(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        savingEdit ||
                        !editDraft.trim() ||
                        editDraft.trim() === (editBaseline?.trim() ?? "")
                      }
                      onClick={() => commitEdit(comment.id)}
                    >
                      {savingEdit ? <LoadingSpinner size="sm" /> : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-stone">
                  {comment.body}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {!editing ? (
                  <CommentLikeButton
                    commentId={comment.id}
                    initialLiked={comment.likedByMe}
                    initialCount={comment.likeCount}
                    disabled={readOnly}
                  />
                ) : null}
                {canReport ? (
                  <ReportDialog
                    subjectType="comment"
                    subjectId={comment.id}
                    title="Report comment"
                    trigger={
                      <button
                        type="button"
                        className="rounded-default p-1 text-fog hover:bg-forest-shadow/80 hover:text-bone"
                        aria-label="Report comment"
                      >
                        <Flag className="size-3.5" aria-hidden />
                      </button>
                    }
                  />
                ) : null}
                {isMine && !readOnly && !editing && (
                  <div className="flex items-center gap-1">
                    {canEdit ? (
                      <button
                        type="button"
                        className="rounded-default p-1 text-fog hover:bg-forest-shadow/80 hover:text-bone"
                        aria-label="Edit comment"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          setEditingId(comment.id);
                          setEditDraft(comment.body);
                          setEditBaseline(comment.body);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                    {confirmDeleteId === comment.id ? (
                      <>
                        <span className="text-[10px] text-fog">Delete?</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] text-dried-blood"
                          onClick={() => {
                            void onDelete(comment.id);
                            setConfirmDeleteId(null);
                          }}
                        >
                          Confirm{" "}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px]"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-default p-1 text-fog hover:bg-forest-shadow/80 hover:text-bone"
                        aria-label="Delete comment"
                        onClick={() => setConfirmDeleteId(comment.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {hasMore && onLoadMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => void onLoadMore()}
        >
          Load more comments
        </Button>
      ) : null}
    </div>
  );
}
