"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { CommentWithAuthor } from "@/types";
import { CommentLikeButton } from "@/components/comments/CommentLikeButton";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CommentList({
  comments,
  currentUserId,
  onDelete,
  onLoadMore,
  hasMore,
  readOnly = false,
}: {
  comments: CommentWithAuthor[];
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
  onLoadMore?: () => void;
  hasMore: boolean;
  readOnly?: boolean;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => {
        const name = comment.author?.display_name ?? "Unknown";
        const slug = comment.author?.slug;
        const isMine = Boolean(currentUserId && comment.profile_id === currentUserId);

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
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-stone">
                {comment.body}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CommentLikeButton
                  commentId={comment.id}
                  initialLiked={comment.likedByMe}
                  initialCount={comment.likeCount}
                  disabled={readOnly}
                />
                {isMine && !readOnly && (
                  <div className="flex items-center gap-1">
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
