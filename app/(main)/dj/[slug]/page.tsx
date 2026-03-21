"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { followsService } from "@/lib/services/follows";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SocialLinks } from "@/components/profile/social-links";
import { FollowButton } from "@/components/profile/follow-button";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

  const isOwnProfile =
    profile != null && currentUser?.id === profile.id;

  useEffect(() => {
    if (!profile || !currentUser || isOwnProfile) return;
    followsService.isFollowing(currentUser.id, profile.id).then(setFollowing);
  }, [currentUser, profile, isOwnProfile]);

  useEffect(() => {
    setFollowing(false);
  }, [profile?.id]);

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
            <FollowButton
              isFollowing={following}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              loading={followLoading}
            />
          ) : null}
        </div>
      </section>

      {profile.social_links && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-bone">
            Links
          </h2>
          <SocialLinks links={profile.social_links} />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-bone">
            Mixes
          </h2>
        </div>
        <EmptyState
          title="No mixes yet"
          description="This DJ hasn't added any mixes."
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-bone">
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
