"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { mixesService } from "@/lib/services/mixes";
import { profilesService } from "@/lib/services/profiles";
import { MixForm } from "@/components/mixes/mix-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { Mix } from "@/types";

export default function EditMixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [mix, setMix] = useState<Mix | null | undefined>(undefined);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/mixes/${id}/edit`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [row, profile] = await Promise.all([
          mixesService.getById(id),
          profilesService.getById(user.id),
        ]);
        if (cancelled) return;
        setProfileSlug(profile?.slug ?? null);
        if (!row || row.profile_id !== user.id) {
          setMix(null);
          return;
        }
        setMix(row);
      } catch {
        if (!cancelled) setMix(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading, router]);

  if (authLoading || mix === undefined) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || mix === null || !profileSlug) {
    return (
      <EmptyState
        title="Mix not found"
        description="This mix doesn't exist or you don't have permission to edit it."
        action={
          <Link
            href="/mixes"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Browse mixes
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bone">Edit mix</h1>
        <p className="mt-1 text-sm text-stone">Update details or replace the embed link.</p>
      </div>
      <MixForm
        mode="edit"
        mix={mix}
        profileId={user.id}
        profileSlug={profileSlug}
      />
    </div>
  );
}
