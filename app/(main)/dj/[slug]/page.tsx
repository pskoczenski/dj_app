"use client";

import { use } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SocialLinks } from "@/components/profile/social-links";
import { FollowButton } from "@/components/profile/follow-button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DjProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { profile, counts, loading, error } = useProfile(slug);
  const { user: currentUser } = useCurrentUser();

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

  const isOwnProfile = currentUser?.id === profile.id;

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
          ) : (
            <FollowButton
              isFollowing={false} // TODO: wire follow service (Step 16)
              onFollow={() => {}}
              onUnfollow={() => {}}
            />
          )}
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
