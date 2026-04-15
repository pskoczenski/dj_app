"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  ensureProfileForUser,
  profileDefaultsFromAuthUser,
} from "@/lib/auth/profile-bootstrap";
import { profilesService } from "@/lib/services/profiles";
import { genresService } from "@/lib/services/genres";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "@/components/shared/character-counter";
import { GenreSelect } from "@/components/forms/genre-select";
import { ImageUpload } from "@/components/forms/image-upload";
import { CityAutocomplete } from "@/components/forms/city-autocomplete";
import { PROFILE_TYPE_OPTIONS } from "@/lib/constants/profile-types";
import { citiesService } from "@/lib/services/cities";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { storageService } from "@/lib/services/storage";
import { toast } from "sonner";
import type { City, Genre, Profile, ProfileType } from "@/types";

const BIO_MAX = 1500;

const SOCIAL_PLATFORMS = [
  "instagram",
  "twitter",
  "facebook",
  "soundcloud",
  "mixcloud",
  "website",
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const {
    profile: hookProfile,
    hasAuthSession,
    loading: userLoading,
    refetch: refetchUser,
  } = useCurrentUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [country, setCountry] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [profileType, setProfileType] = useState<ProfileType>("dj");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Validation
  const [slugWarning, setSlugWarning] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userLoading) return;

    let cancelled = false;

    async function load() {
      try {
        if (!hasAuthSession) {
          router.replace("/login?redirect=/profile/edit");
          return;
        }

        let p = hookProfile;
        if (!p) {
          const sb = createClient();
          const {
            data: { user: authUser },
          } = await sb.auth.getUser();
          if (!authUser) {
            return;
          }
          p = await profilesService.getById(authUser.id);
          if (!p) {
            try {
              const { displayName, profileType } =
                profileDefaultsFromAuthUser(authUser);
              await ensureProfileForUser({
                userId: authUser.id,
                displayName,
                profileType,
              });
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Could not create your profile.",
              );
              return;
            }
            p = await profilesService.getById(authUser.id);
            await refetchUser();
          }
        }

        if (cancelled) return;

        if (!p) {
          toast.error("Could not load your profile.");
          return;
        }

        setProfile(p);
        setDisplayName(p.display_name);
        setSlug(p.slug);
        setBio(p.bio ?? "");
        setSelectedCity(p.cities ?? null);
        if (p.city_id && !p.cities) {
          try {
            const c = await citiesService.getById(p.city_id);
            if (!cancelled) setSelectedCity(c);
          } catch {
            if (!cancelled) setSelectedCity(null);
          }
        }
        setCountry(p.country ?? "");
        if (p.genre_ids && p.genre_ids.length > 0) {
          try {
            const resolved = await genresService.getByIds(p.genre_ids);
            if (!cancelled) setSelectedGenres(resolved);
          } catch {
            if (!cancelled) setSelectedGenres([]);
          }
        } else {
          setSelectedGenres([]);
        }
        setProfileType(p.profile_type);
        setSocialLinks(
          typeof p.social_links === "object" && p.social_links !== null
            ? (p.social_links as Record<string, string>)
            : {},
        );
        setProfileImageUrl(p.profile_image_url);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // hookProfile?.id: stable when profile row is loaded (object identity from hook may change).
    // Omit router — useRouter() identity can change every render and would retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, hasAuthSession, hookProfile?.id]);

  async function checkSlug(value: string) {
    if (!value || value === profile?.slug) {
      setSlugWarning("");
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", value)
      .maybeSingle();

    setSlugWarning(data ? "This slug is already taken." : "");
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (displayName.length < 2) e.displayName = "Display name must be at least 2 characters.";
    if (displayName.length > 50) e.displayName = "Display name must be 50 characters or less.";
    if (!slug) e.slug = "Slug is required.";
    if (bio.length > BIO_MAX) e.bio = `Bio must be ${BIO_MAX} characters or less.`;
    if (!selectedCity) e.cityId = "City is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !profile || slugWarning || !selectedCity) return;

    setSaving(true);
    try {
      const genre_ids = selectedGenres.map((g) => g.id);
      await profilesService.update(profile.id, {
        display_name: displayName,
        slug,
        bio: bio || null,
        city_id: selectedCity.id,
        country: country || null,
        genre_ids,
        profile_type: profileType,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        profile_image_url: profileImageUrl,
      });
      toast.success("Profile updated!");
      router.push(`/dj/${slug}`);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-bone">
        Edit Profile
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-bone">Profile Image</p>
          <ImageUpload
            currentUrl={profileImageUrl}
            onUploadComplete={async (file) => {
              const url = await storageService.uploadProfileImage(
                profile!.id,
                file,
              );
              setProfileImageUrl(url);
              return url;
            }}
            onRemove={() => setProfileImageUrl(null)}
            label="Upload profile image"
          />
        </div>

        <Field label="Display Name" id="display-name" error={errors.displayName}>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            minLength={2}
            maxLength={50}
            required
          />
        </Field>

        <Field label="Slug" id="slug" error={errors.slug || slugWarning}>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            onBlur={() => checkSlug(slug)}
            required
          />
          <p className="mt-1 text-xs text-fog">Your profile URL: /dj/{slug}</p>
        </Field>

        <Field label="Bio" id="bio" error={errors.bio}>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={BIO_MAX + 100}
          />
          <CharacterCounter value={bio} max={BIO_MAX} className="mt-1" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" id="profile-city-id" error={errors.cityId}>
            <CityAutocomplete
              id="profile-city-id"
              value={selectedCity}
              onChange={setSelectedCity}
              aria-label="Home city"
            />
          </Field>
          <Field label="Country" id="country">
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. US"
            />
          </Field>
        </div>

        {/* Genres */}
        <Field label="Genres" id="genres">
          <GenreSelect
            label="Genres"
            value={selectedGenres}
            onChange={setSelectedGenres}
            maxSelections={10}
          />
        </Field>

        {/* Profile type */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-bone">
            Profile Type
          </legend>
          <div className="flex gap-4">
            {PROFILE_TYPE_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-bone"
              >
                <input
                  type="radio"
                  name="profileType"
                  value={value}
                  checked={profileType === value}
                  onChange={() => setProfileType(value)}
                  className="accent-fern"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Social links */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-bone">
            Social Links
          </legend>
          <div className="flex flex-col gap-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="flex items-center gap-3">
                <span className="w-24 text-sm capitalize text-stone">
                  {platform}
                </span>
                <Input
                  value={socialLinks[platform] ?? ""}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      [platform]: e.target.value,
                    }))
                  }
                  placeholder={`https://`}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* Mixes anchor for Quick Create link */}
        <section id="mixes" className="scroll-mt-20">
          <h2 className="mb-2 heading-subtle text-xl font-semibold text-bone">
            Mixes
          </h2>
          <p className="text-sm text-stone">
            Manage your mixes from your profile page once the mixes feature is
            available.
          </p>
        </section>

        <Button type="submit" disabled={saving || !!slugWarning}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-bone">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-dried-blood">{error}</p>}
    </div>
  );
}
