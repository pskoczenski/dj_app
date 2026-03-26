import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatSetTime12h } from "@/lib/format-time";
import type { EventLineup } from "@/types";

interface LineupProfile {
  id: string;
  display_name: string;
  slug: string;
  profile_image_url?: string | null;
  genres?: string[] | null;
}

interface LineupCardProps {
  item: EventLineup;
  profile?: LineupProfile | null;
}

export function LineupCard({ item, profile }: LineupCardProps) {
  const name = profile?.display_name ?? "Unknown DJ";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = (
    <div className="flex items-center gap-3 rounded-default border border-root-line p-3 transition-colors hover:border-sage-edge">
      <Avatar className="size-10">
        {profile?.profile_image_url ? (
          <AvatarImage
            src={profile.profile_image_url}
            alt={name}
            className="box-border border-2 border-border"
          />
        ) : (
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bone">{name}</span>
          {item.is_headliner && (
            <Badge variant="default" className="text-[10px]">
              Headliner
            </Badge>
          )}
        </div>
        {item.set_time && (
          <span className="text-xs text-stone">
            {formatSetTime12h(item.set_time)}
          </span>
        )}
        {profile?.genres && profile.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {profile.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="outline" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (profile?.slug) {
    return <Link href={`/dj/${profile.slug}`}>{inner}</Link>;
  }

  return inner;
}
