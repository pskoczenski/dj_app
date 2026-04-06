"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLikedMixIds } from "@/hooks/use-liked-mix-ids";
import { followsService } from "@/lib/services/follows";
import { mixesService } from "@/lib/services/mixes";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SocialLinks } from "@/components/profile/social-links";
import { FollowButton } from "@/components/profile/follow-button";
import { EmptyState } from "@/components/shared/empty-state";
import { MixCard } from "@/components/mixes/mix-card";
import { QuickMessageDialog } from "@/components/messages/QuickMessageDialog";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { MixWithCreator } from "@/types";

export default function DjProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { profile, counts, loading, error } = useProfile(slug);
  const { user: currentUser } = useCurrentUser();

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [mixes, setMixes] = useState<MixWithCreator[]>([]);
  const [mixesLoading, setMixesLoading] = useState(false);
  const [expandedMixId, setExpandedMixId] = useState<string | null>(null);
  const [mixToDelete, setMixToDelete] = useState<MixWithCreator | null>(null);

  const mixIds = useMemo(() => mixes.map((m) => m.id), [mixes]);
  const serverLikedIds = useLikedMixIds(mixIds, currentUser?.id);
  const mixesListKey = mixIds.join(",");
  const [optimisticLiked, setOptimisticLiked] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setOptimisticLiked({});
  }, [mixesListKey]);

  const likedByMe = useCallback(
    (mixId: string) =>
      Object.hasOwn(optimisticLiked, mixId)
        ? optimisticLiked[mixId]
        : serverLikedIds.has(mixId),
    [optimisticLiked, serverLikedIds],
  );

  const isOwnProfile =
    profile != null && currentUser?.id === profile.id;

  useEffect(() => {
    if (!profile || !currentUser || isOwnProfile) return;
    followsService.isFollowing(currentUser.id, profile.id).then(setFollowing);
  }, [currentUser, profile, isOwnProfile]);

  useEffect(() => {
    setFollowing(false);
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) {
      setMixes([]);
      return;
    }
    let cancelled = false;
    setMixesLoading(true);
    mixesService
      .getByProfile(profile.id)
      .then((data) => {
        if (!cancelled) setMixes(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load mixes.");
      })
      .finally(() => {
        if (!cancelled) setMixesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const refetchMixes = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await mixesService.getByProfile(profile.id);
      setMixes(data);
    } catch {
      toast.error("Could not refresh mixes.");
    }
  }, [profile]);

  const moveMix = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!profile || toIndex < 0 || toIndex >= mixes.length) return;
      const next = [...mixes];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      setMixes(next);
      try {
        await mixesService.reorder(
          profile.id,
          next.map((m) => m.id),
        );
      } catch {
        toast.error("Could not reorder mixes.");
        void refetchMixes();
      }
    },
    [mixes, profile, refetchMixes],
  );

  const confirmDeleteMix = useCallback(async () => {
    if (!mixToDelete) return;
    try {
      await mixesService.delete(mixToDelete.id);
      toast.success("Mix removed.");
      setMixToDelete(null);
      setMixes((prev) => prev.filter((m) => m.id !== mixToDelete.id));
    } catch {
      toast.error("Could not delete mix.");
    }
  }, [mixToDelete]);

  const handleFollow = useCallback(async () => {
    if (!currentUser || !profile) return;
    setFollowLoading(true);
    try {
      await followsService.follow(currentUser.id, profile.id);
      setFollowing(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to follow.");
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, profile]);

  const handleUnfollow = useCallback(async () => {
    if (!currentUser || !profile) return;
    setFollowLoading(true);
    try {
      await followsService.unfollow(currentUser.id, profile.id);
      setFollowing(false);
    } catch {
      toast.error("Failed to unfollow.");
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, profile]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <Skeleton className="size-28 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <EmptyState
        title="Profile not found"
        description="This DJ doesn't exist or the page has been removed."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <ProfileHeader profile={profile} counts={counts} />

        <div className="mt-4 flex items-center gap-3">
          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Edit Profile
            </Link>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <FollowButton
                isFollowing={following}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                loading={followLoading}
              />
              <QuickMessageDialog
                recipientId={profile.id}
                recipientName={profile.display_name}
                recipientImageUrl={profile.profile_image_url}
                trigger={
                  <span
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Message
                  </span>
                }
              />
            </div>
          ) : null}
        </div>
      </section>

      {profile.social_links && (
        <section>
          <h2 className="mb-3 heading-subtle text-xl font-semibold text-bone">
            Links
          </h2>
          <SocialLinks links={profile.social_links} />
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="heading-subtle text-xl font-semibold text-bone">
            Mixes
          </h2>
          {isOwnProfile && (
            <Link
              href="/mixes/new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Add Mix
            </Link>
          )}
        </div>
        {mixesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-default" />
            <Skeleton className="h-24 w-full rounded-default" />
          </div>
        ) : mixes.length === 0 ? (
          <EmptyState
            title="No mixes yet"
            description={
              isOwnProfile
                ? "Add your first mix to show it here."
                : "This DJ hasn't added any mixes."
            }
            action={
              isOwnProfile ? (
                <Link
                  href="/mixes/new"
                  className={buttonVariants({ size: "sm" })}
                >
                  Add Mix
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {mixes.map((mix, index) => (
              <MixCard
                key={mix.id}
                mix={mix}
                expanded={expandedMixId === mix.id}
                onToggle={() =>
                  setExpandedMixId((id) =>
                    id === mix.id ? null : mix.id,
                  )
                }
                likedByMe={likedByMe(mix.id)}
                currentUserId={currentUser?.id ?? null}
                onLikeChange={(next) => {
                  setMixes((prev) =>
                    prev.map((m) =>
                      m.id === mix.id
                        ? { ...m, likes_count: next.likesCount }
                        : m,
                    ),
                  );
                  setOptimisticLiked((prev) => ({
                    ...prev,
                    [mix.id]: next.liked,
                  }));
                }}
                manageMode={isOwnProfile}
                disableMoveUp={index === 0}
                disableMoveDown={index === mixes.length - 1}
                onMoveUp={() => void moveMix(index, index - 1)}
                onMoveDown={() => void moveMix(index, index + 1)}
                onDelete={() => setMixToDelete(mix)}
              />
            ))}
          </div>
        )}
      </section>

      <AlertDialog
        open={mixToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMixToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this mix?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{mixToDelete?.title ?? "this mix"}&rdquo; from
              your profile. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmDeleteMix()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section>
        <h2 className="mb-3 heading-subtle text-xl font-semibold text-bone">
          Events
        </h2>
        <EmptyState
          title="No events yet"
          description="No upcoming or past events to show."
        />
      </section>
    </div>
  );
}
