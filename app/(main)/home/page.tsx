"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLikedEventIds } from "@/hooks/use-liked-event-ids";
import { eventsService } from "@/lib/services/events";
import { mixesService } from "@/lib/services/mixes";
import { profilesService, type FollowCounts } from "@/lib/services/profiles";
import { EventCard } from "@/components/events/event-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, CalendarPlus, Music, AlertCircle } from "lucide-react";
import type { EventWithLineupPreview, MixWithCreator } from "@/types";
import { DEFAULT_SIGNUP_CITY_ID } from "@/lib/db/default-city";

export default function HomePage() {
  const { user, profile, hasAuthSession, loading: userLoading } =
    useCurrentUser();
  const [nearbyEvents, setNearbyEvents] = useState<EventWithLineupPreview[]>(
    [],
  );
  const [upcomingGigs, setUpcomingGigs] = useState<EventWithLineupPreview[]>(
    [],
  );
  const [recentMixes, setRecentMixes] = useState<MixWithCreator[]>([]);
  const [counts, setCounts] = useState<FollowCounts>({
    followersCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const homeEventIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of [...nearbyEvents, ...upcomingGigs]) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        out.push(e.id);
      }
    }
    return out;
  }, [nearbyEvents, upcomingGigs]);

  const serverLikedEventIds = useLikedEventIds(homeEventIds, user?.id);
  const homeEventsListKey = homeEventIds.join("\0");
  const [optimisticEventLiked, setOptimisticEventLiked] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setOptimisticEventLiked({});
  }, [homeEventsListKey]);

  const likedEventByMe = useCallback(
    (eventId: string) =>
      Object.hasOwn(optimisticEventLiked, eventId)
        ? optimisticEventLiked[eventId]
        : serverLikedEventIds.has(eventId),
    [optimisticEventLiked, serverLikedEventIds],
  );

  function handleHomeEventLikeChange(
    eventId: string,
    next: { liked: boolean; likesCount: number },
  ) {
    const patch = (list: EventWithLineupPreview[]) =>
      list.map((e) =>
        e.id === eventId ? { ...e, likes_count: next.likesCount } : e,
      );
    setNearbyEvents((prev) => patch(prev));
    setUpcomingGigs((prev) => patch(prev));
    setOptimisticEventLiked((o) => ({ ...o, [eventId]: next.liked }));
  }

  useEffect(() => {
    if (userLoading) return;
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [nearby, gigs, mixes, fc] = await Promise.all([
          eventsService.getUpcoming(profile!.cities?.state_code ?? undefined),
          eventsService.getByProfile(user!.id),
          mixesService.getAll({ sort: "newest", range: [0, 5] }),
          profilesService.getFollowCounts(user!.id),
        ]);
        setNearbyEvents(nearby.slice(0, 6));
        const today = new Date().toISOString().split("T")[0];
        setUpcomingGigs(
          gigs.filter((e) => e.start_date >= today).slice(0, 4),
        );
        setRecentMixes(mixes);
        setCounts(fc);
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, profile, userLoading]);

  if (userLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasAuthSession) {
    return (
      <EmptyState
        title="Not logged in"
        description="Please log in to see your dashboard."
        action={
          <Link
            href="/login"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Log in
          </Link>
        }
      />
    );
  }

  if (!profile || !user) {
    return (
      <EmptyState
        title="Finish your profile setup"
        description="We could not load your profile yet. Open profile settings to complete your account."
        action={
          <Link
            href="/profile/edit"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Open Profile Settings
          </Link>
        }
      />
    );
  }

  const profileIncomplete =
    !profile.bio || profile.city_id === DEFAULT_SIGNUP_CITY_ID;
  const initials = user.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      {/* Sidebar */}
      <aside
        aria-label="User profile and actions"
        className="flex flex-col gap-5 lg:w-[270px] lg:shrink-0"
      >
        {/* Profile card */}
        <Card>
          {/* One container only: structure via spacing + type, not nested borders. */}
          {/* Slightly tighter bottom padding to reduce dead space under CTA. */}
          <CardContent className="flex flex-col items-center px-4 pb-3 pt-4">
            <Avatar className="size-20 ring-1 ring-mb-border-soft ring-inset">
              {user.avatarUrl ? (
                <AvatarImage
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="box-border"
                />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            {/* Avatar → name: 12–16px. Name + handle: tight pair (2–4px). */}
            <div className="mt-3 text-center leading-tight">
              <p className="heading-subtle text-lg font-bold text-bone">
                {user.displayName}
              </p>
              <p className="mt-0.5 text-xs text-fog">@{user.slug}</p>
            </div>
            {/* Handle → stats: ~32px. No borders/dividers; spacing + type does the work. */}
            <div className="mt-5 flex w-full items-center justify-center gap-14">
              <div className="flex flex-col items-center">
                <span className="text-base font-semibold tabular-nums text-mb-text-primary">
                  {counts.followersCount}
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-mb-text-tertiary/80">
                  Followers
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base font-semibold tabular-nums text-mb-text-primary">
                  {counts.followingCount}
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-mb-text-tertiary/80">
                  Following
                </span>
              </div>
            </div>

            {/* Stats → action: whitespace instead of an internal divider. */}
            <div className="mt-4 w-full">
              <Link
                href={`/dj/${user.slug}`}
                className={buttonVariants({
                  // Option A: full-width ghost button with subtle border + gentle hover fill.
                  variant: "ghost",
                  size: "sm",
                  className:
                    "h-11 w-full justify-center border border-mb-border-soft bg-transparent text-mb-text-primary hover:bg-mb-surface-3/60 hover:text-mb-text-primary",
                })}
              >
                View Profile
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            {/* Eyebrow-style label to differentiate from content titles. */}
            <CardTitle className="text-xs font-medium uppercase tracking-[0.14em] text-mb-text-tertiary">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <Link
              href="/events/create"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "h-11 w-full justify-start gap-2 border-mb-border-soft bg-transparent hover:bg-mb-surface-3 hover:text-mb-text-primary",
              })}
            >
              <CalendarPlus className="size-4 shrink-0" />
              Create Event
            </Link>
            <Link
              href="/mixes/new"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "h-11 w-full justify-start gap-2 border-mb-border-soft bg-transparent hover:bg-mb-surface-3 hover:text-mb-text-primary",
              })}
            >
              <Music className="size-4 shrink-0" />
              Add Mix
            </Link>
            <Link
              href="/events?filter=saved"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "h-11 w-full justify-start gap-2 border-mb-border-soft bg-transparent hover:bg-mb-surface-3 hover:text-mb-text-primary",
              })}
            >
              <Bookmark className="size-4 shrink-0" />
              Saved Events
            </Link>
          </CardContent>
        </Card>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Complete profile banner */}
        {profileIncomplete && (
          <div className="flex items-center gap-3 rounded-default border border-amber-sap/40 bg-amber-sap/10 px-4 py-3 text-sm">
            <AlertCircle className="size-4 shrink-0 text-amber-sap" />
            <span className="text-stone">
              Your profile is incomplete.{" "}
              <Link href="/profile/edit" className="font-medium text-bone underline">
                Add your bio and location
              </Link>{" "}
              to help others find you.
            </span>
          </div>
        )}

        {/* Events near you */}
        <section>
          {/* Heading row: aligns baseline with sidebar while keeping feed rhythm. */}
          <h2 className="mb-4 heading-subtle text-xl font-bold text-bone">
            Events Near You
          </h2>
          {profile?.city_id === DEFAULT_SIGNUP_CITY_ID && (
            <p className="mb-3 text-sm text-fog">
              Choose your home city in{" "}
              <Link href="/profile/edit" className="underline">
                profile settings
              </Link>{" "}
              to see local events.
            </p>
          )}
          {nearbyEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  likedByMe={likedEventByMe(event.id)}
                  currentUserId={user?.id}
                  onLikeChange={(next) =>
                    handleHomeEventLikeChange(event.id, next)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events"
              description="Check back later or create one!"
            />
          )}
        </section>

        {/* Upcoming gigs */}
        <section>
          <h2 className="mb-4 heading-subtle text-xl font-bold text-bone">
            Your Upcoming Gigs
          </h2>
          {upcomingGigs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingGigs.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  likedByMe={likedEventByMe(event.id)}
                  currentUserId={user?.id}
                  onLikeChange={(next) =>
                    handleHomeEventLikeChange(event.id, next)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming gigs"
              description="Events you create or are tagged in will appear here."
            />
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="mb-4 heading-subtle text-xl font-bold text-bone">
            Recent From the Community
          </h2>
          {recentMixes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentMixes.map((mix) => (
                <div
                  key={mix.id}
                  className="flex items-center gap-3 rounded-default border border-root-line p-3"
                >
                  <Music className="size-4 shrink-0 text-fog" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-bone">{mix.title}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {mix.platform}
                      </Badge>
                      {mix.genres?.slice(0, 2).map((g) => (
                        <Badge key={g} variant="secondary" className="text-[10px]">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent activity"
              description="New mixes and events from the community will show up here."
            />
          )}
        </section>
      </div>
    </div>
  );
}
