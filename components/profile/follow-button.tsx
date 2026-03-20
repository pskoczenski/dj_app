"use client";

import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  loading?: boolean;
}

export function FollowButton({
  isFollowing,
  onFollow,
  onUnfollow,
  loading = false,
}: FollowButtonProps) {
  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      disabled={loading}
      onClick={isFollowing ? onUnfollow : onFollow}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
