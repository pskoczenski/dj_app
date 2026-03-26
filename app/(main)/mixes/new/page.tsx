"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { profilesService } from "@/lib/services/profiles";
import { MixForm } from "@/components/mixes/mix-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { buttonVariants } from "@/components/ui/button";

export default function NewMixPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/mixes/new");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await profilesService.getById(user.id);
        if (cancelled) return;
        if (!p?.slug) {
          setError("Profile not found.");
          return;
        }
        setProfileSlug(p.slug);
      } catch {
        if (!cancelled) setError("Could not load profile.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || (!error && user && !profileSlug)) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || error || !profileSlug) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 text-center">
        <h1 className="font-display text-2xl font-bold text-bone">
          Can&apos;t add a mix
        </h1>
        <p className="text-sm text-stone">
          {error ?? "You need to be signed in with a profile."}
        </p>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bone">Add mix</h1>
        <p className="mt-1 text-sm text-stone">
          Paste a streaming link, add details, and publish to your profile.
        </p>
      </div>
      <MixForm
        mode="create"
        profileId={user.id}
        profileSlug={profileSlug}
      />
    </div>
  );
}
