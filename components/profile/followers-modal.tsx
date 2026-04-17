"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { FollowButton } from "@/components/profile/follow-button";
import { useFollowList } from "@/hooks/use-follow-list";
import { useCurrentUser } from "@/hooks/use-current-user";
import { followsService } from "@/lib/services/follows";

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  type: "followers" | "following";
  title: string;
}

export function FollowersModal({
  open,
  onOpenChange,
  profileId,
  type,
  title,
}: FollowersModalProps) {
  const { profiles, loading } = useFollowList(profileId, type, open);
  const { user: currentUser } = useCurrentUser();

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  const fetchFollowingSet = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await followsService.getFollowing(currentUser.id);
      setFollowingIds(new Set(data.map((p) => p.id)));
    } catch {
      // silent — follow buttons default to "Follow" if this fails
    }
  }, [currentUser]);

  useEffect(() => {
    if (!open) return;
    void fetchFollowingSet();
  }, [open, fetchFollowingSet]);

  function amFollowing(id: string): boolean {
    return Object.hasOwn(optimistic, id) ? optimistic[id] : followingIds.has(id);
  }

  async function handleFollow(targetId: string) {
    if (!currentUser) return;
    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
    try {
      await followsService.follow(currentUser.id, targetId);
      setOptimistic((prev) => ({ ...prev, [targetId]: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to follow.");
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  }

  async function handleUnfollow(targetId: string) {
    if (!currentUser) return;
    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
    try {
      await followsService.unfollow(currentUser.id, targetId);
      setOptimistic((prev) => ({ ...prev, [targetId]: false }));
    } catch {
      toast.error("Failed to unfollow.");
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(80vh,36rem)] w-full max-w-sm flex-col gap-0 p-0"
      >
        <DialogHeader className="border-b border-foreground/10 px-4 py-3">
          <DialogTitle className="text-bone">{title}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone">
              {type === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
            </p>
          ) : (
            <ul>
              {profiles.map((profile) => {
                const initials = profile.display_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const showFollowButton =
                  currentUser != null && currentUser.id !== profile.id;
                return (
                  <li
                    key={profile.id}
                    className="flex items-center gap-2 border-b border-foreground/5 px-4 py-3 last:border-0"
                  >
                    <Link
                      href={`/dj/${profile.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      <Avatar className="size-9 shrink-0">
                        {profile.profile_image_url && (
                          <AvatarImage
                            src={profile.profile_image_url}
                            alt={profile.display_name}
                          />
                        )}
                        <AvatarFallback className="bg-forest-shadow text-sm text-bone">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-bone">
                          {profile.display_name}
                        </p>
                        <p className="truncate text-xs text-stone">
                          @{profile.slug}
                        </p>
                      </div>
                    </Link>
                    {showFollowButton && (
                      <FollowButton
                        isFollowing={amFollowing(profile.id)}
                        onFollow={() => void handleFollow(profile.id)}
                        onUnfollow={() => void handleUnfollow(profile.id)}
                        loading={followLoading[profile.id] ?? false}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
