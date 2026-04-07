"use client";

import { use } from "react";
import Link from "next/link";
import { MixEmbed } from "@/components/mixes/mix-embed";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useMix } from "@/hooks/use-mix";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

function platformLabel(platform: string): string {
  switch (platform) {
    case "apple_music":
      return "Apple Music";
    case "soundcloud":
      return "SoundCloud";
    case "mixcloud":
      return "Mixcloud";
    case "youtube":
      return "YouTube";
    case "spotify":
      return "Spotify";
    default:
      return "Link";
  }
}

export default function MixDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { mix, loading, error } = useMix(id);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !mix) {
    return (
      <EmptyState
        title="Mix not found"
        description={
          error?.message ??
          "This mix may have been removed or you may not have access."
        }
        action={
          <Link href="/mixes" className={buttonVariants({ variant: "outline" })}>
            Back to mixes
          </Link>
        }
      />
    );
  }

  const creatorName = mix.creator?.display_name?.trim();
  const creatorSlug = mix.creator?.slug?.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-5">
      <Link
        href="/mixes"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "inline-flex w-fit gap-2 text-mb-text-secondary hover:text-mb-text-primary",
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mixes
      </Link>

      <header className="space-y-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-mb-text-primary md:text-3xl">
          {mix.title}
        </h1>
        <p className="text-sm text-mb-text-secondary">
          {creatorName ? (
            creatorSlug ? (
              <Link
                href={`/dj/${creatorSlug}`}
                className="font-medium text-mb-turquoise-pale hover:underline"
              >
                {creatorName}
              </Link>
            ) : (
              <span className="font-medium">{creatorName}</span>
            )
          ) : null}
          {creatorName ? (
            <span className="text-mb-text-tertiary" aria-hidden>
              {" "}
              ·{" "}
            </span>
          ) : null}
          <span>{platformLabel(mix.platform)}</span>
        </p>
        {mix.genres && mix.genres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {mix.genres.map((g) => (
              <Badge
                key={g}
                variant="outline"
                className="rounded-full border-mb-border-soft bg-transparent text-xs font-medium text-mb-text-secondary"
              >
                {g}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <section aria-label="Mix player" className="space-y-4">
        <MixEmbed
          url={mix.embed_url}
          platform={mix.platform}
          title={mix.title}
        />
        {mix.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-mb-text-secondary">
            {mix.description}
          </p>
        ) : null}
      </section>

      <footer className="flex flex-wrap gap-3 border-t border-mb-border-hair pt-6">
        <a
          href={mix.embed_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Open on {platformLabel(mix.platform)}
        </a>
      </footer>
    </div>
  );
}
