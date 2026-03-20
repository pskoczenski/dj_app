import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";
import type { FollowCounts } from "@/lib/services/profiles";

interface ProfileHeaderProps {
  profile: Profile;
  counts: FollowCounts;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function ProfileHeader({
  profile,
  counts,
  onFollowersClick,
  onFollowingClick,
}: ProfileHeaderProps) {
  const initials = profile.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <Avatar className="size-24 sm:size-28">
        {profile.profile_image_url && (
          <AvatarImage src={profile.profile_image_url} alt={profile.display_name} />
        )}
        <AvatarFallback className="bg-forest-shadow text-2xl text-bone">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 text-center sm:text-left">
        <h1 className="font-display text-3xl font-bold tracking-[0.02em] text-bone md:text-4xl">
          {profile.display_name}
        </h1>
        <p className="text-sm text-fog">@{profile.slug}</p>

        {location && <p className="mt-1 text-sm text-stone">{location}</p>}

        {profile.bio && (
          <p className="mt-2 max-w-prose text-sm text-stone">{profile.bio}</p>
        )}

        {profile.genres && profile.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.genres.map((g) => (
              <Badge key={g} variant="genre">
                {g}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-4 text-sm sm:justify-start">
          <button
            type="button"
            onClick={onFollowersClick}
            className="text-stone hover:text-bone"
          >
            <span className="font-medium text-bone">{counts.followersCount}</span>{" "}
            followers
          </button>
          <button
            type="button"
            onClick={onFollowingClick}
            className="text-stone hover:text-bone"
          >
            <span className="font-medium text-bone">{counts.followingCount}</span>{" "}
            following
          </button>
        </div>
      </div>
    </div>
  );
}
