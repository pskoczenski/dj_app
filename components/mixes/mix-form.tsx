"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mixesService } from "@/lib/services/mixes";
import { genresService } from "@/lib/services/genres";
import { storageService, validateImageFile } from "@/lib/services/storage";
import { getPlatformFromUrl, isAllowedEmbedHost } from "@/lib/utils/embed";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GenreTagInput } from "@/components/forms/genre-tag-input";
import { ImageUpload } from "@/components/forms/image-upload";
import { MixEmbed } from "@/components/mixes/mix-embed";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Constants } from "@/types/database";
import type { Mix, MixInsert, MixUpdate, MixPlatform } from "@/types";

const MIX_PLATFORMS = Constants.public.Enums.mix_platform;

const PLATFORM_LABELS: Record<MixPlatform, string> = {
  soundcloud: "SoundCloud",
  mixcloud: "Mixcloud",
  youtube: "YouTube",
  spotify: "Spotify",
  apple_music: "Apple Music",
  other: "Other",
};

function genresKey(genres: string[]): string {
  return [...genres]
    .map((g) => g.trim())
    .filter(Boolean)
    .sort()
    .join("\0");
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface MixFormProps {
  mode: "create" | "edit";
  mix?: Mix;
  profileId: string;
  profileSlug: string;
}

export function MixForm({ mode, mix, profileId, profileSlug }: MixFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const manualCoverRef = useRef(false);
  const lastRemoteThumbRef = useRef<string | null>(null);

  const initialGenresKey = useMemo(
    () => genresKey(mix?.genres ?? []),
    [mix?.genres],
  );
  const initialGenresRef = useRef(initialGenresKey);
  initialGenresRef.current = initialGenresKey;

  const [embedUrl, setEmbedUrl] = useState(mix?.embed_url ?? "");
  const [title, setTitle] = useState(mix?.title ?? "");
  const [description, setDescription] = useState(mix?.description ?? "");
  const [platform, setPlatform] = useState<MixPlatform>(
    mix?.platform ?? "other",
  );
  const [genres, setGenres] = useState<string[]>(mix?.genres ?? []);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    mix?.cover_image_url ?? null,
  );
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState<string | null>(
    null,
  );
  /** Remote thumbnail URL from oEmbed (create flow); uploaded or stored on save. */
  const [oembedCoverUrl, setOembedCoverUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    };
  }, [pendingCoverPreview]);

  useEffect(() => {
    if (mode !== "create") return;
    const raw = embedUrl.trim();
    if (!raw || !isValidHttpUrl(raw) || !isAllowedEmbedHost(raw)) {
      setOembedCoverUrl(null);
      lastRemoteThumbRef.current = null;
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/mix-oembed?url=${encodeURIComponent(raw)}`,
        );
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as {
          title?: string | null;
          thumbnailUrl?: string | null;
        };
        if (cancelled) return;

        if (data.title && typeof data.title === "string") {
          const sliced = data.title.trim().slice(0, 200);
          if (sliced)
            setTitle((prev) => (prev.trim() === "" ? sliced : prev));
        }

        if (
          data.thumbnailUrl &&
          typeof data.thumbnailUrl === "string" &&
          data.thumbnailUrl.startsWith("http")
        ) {
          lastRemoteThumbRef.current = data.thumbnailUrl;
          if (!manualCoverRef.current) {
            setOembedCoverUrl(data.thumbnailUrl);
          }
        }
      } catch {
        /* ignore */
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [embedUrl, mode]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const url = embedUrl.trim();
    if (!url) e.embedUrl = "Embed URL is required.";
    else if (!isValidHttpUrl(url)) e.embedUrl = "Enter a valid http(s) URL.";
    if (!title.trim()) e.title = "Title is required.";
    if (!platform) e.platform = "Platform is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onEmbedUrlBlur() {
    const url = embedUrl.trim();
    if (!url) return;
    const detected = getPlatformFromUrl(url);
    if (detected !== "other") setPlatform(detected);
  }

  function onEmbedPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData?.getData("text") ?? "";
    const combined = (pasted || embedUrl).trim();
    if (!combined) return;
    const detected = getPlatformFromUrl(combined);
    if (detected !== "other") setPlatform(detected);
  }

  async function onCreateCoverFile(file: File) {
    const v = validateImageFile(file);
    if (!v.valid) {
      toast.error(v.error ?? "Invalid image.");
      return;
    }
    manualCoverRef.current = true;
    setOembedCoverUrl(null);
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    setPendingCoverFile(file);
    setPendingCoverPreview(URL.createObjectURL(file));
  }

  function clearPendingCover() {
    manualCoverRef.current = false;
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    setPendingCoverPreview(null);
    setPendingCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    setOembedCoverUrl(lastRemoteThumbRef.current);
  }

  function clearOembedCoverOnly() {
    lastRemoteThumbRef.current = null;
    setOembedCoverUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (mode === "create") {
        const profileMixes = await mixesService.getByProfile(profileId);
        const nextSort =
          profileMixes.reduce(
            (max, m) => Math.max(max, m.sort_order ?? 0),
            -1,
          ) + 1;

        const genre_ids = await genresService.resolveLabelsToIds(genres);
        const payload: MixInsert = {
          profile_id: profileId,
          title: title.trim(),
          embed_url: embedUrl.trim(),
          platform,
          description: description.trim() || null,
          genre_ids,
          cover_image_url: null,
          sort_order: nextSort,
        };

        const created = await mixesService.create(payload);

        if (pendingCoverFile) {
          const publicUrl = await storageService.uploadMixCover(
            created.id,
            pendingCoverFile,
          );
          await mixesService.update(created.id, {
            cover_image_url: publicUrl,
          });
        } else if (oembedCoverUrl) {
          try {
            const thumbRes = await fetch(oembedCoverUrl, { mode: "cors" });
            if (thumbRes.ok) {
              const blob = await thumbRes.blob();
              const mime = blob.type || "image/jpeg";
              const ext = mime.includes("png")
                ? "png"
                : mime.includes("webp")
                  ? "webp"
                  : "jpg";
              const coverFile = new File([blob], `cover.${ext}`, {
                type: mime || "image/jpeg",
              });
              const v = validateImageFile(coverFile);
              if (v.valid) {
                const publicUrl = await storageService.uploadMixCover(
                  created.id,
                  coverFile,
                );
                await mixesService.update(created.id, {
                  cover_image_url: publicUrl,
                });
              } else {
                await mixesService.update(created.id, {
                  cover_image_url: oembedCoverUrl,
                });
              }
            } else {
              await mixesService.update(created.id, {
                cover_image_url: oembedCoverUrl,
              });
            }
          } catch {
            await mixesService.update(created.id, {
              cover_image_url: oembedCoverUrl,
            });
          }
        }

        toast.success("Mix added!");
        router.push(`/dj/${profileSlug}`);
        return;
      }

      if (!mix) return;

      const genre_ids = await genresService.resolveLabelsToIds(genres);
      const payload: MixUpdate = {
        title: title.trim(),
        embed_url: embedUrl.trim(),
        platform,
        description: description.trim() || null,
        genre_ids,
        cover_image_url: coverUrl,
      };

      await mixesService.update(mix.id, payload);

      toast.success("Mix updated!");
      router.push(`/dj/${profileSlug}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  const showPreview =
    embedUrl.trim().length > 0 &&
    isValidHttpUrl(embedUrl.trim()) &&
    Boolean(platform);

  const draftTitle = title.trim() || "Preview";

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="mix-embed-url" className="text-sm font-medium text-bone">
          Embed URL *
        </label>
        <Input
          id="mix-embed-url"
          type="url"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          onBlur={onEmbedUrlBlur}
          onPaste={onEmbedPaste}
          placeholder="https://soundcloud.com/…"
          required
          aria-invalid={Boolean(errors.embedUrl)}
        />
        {errors.embedUrl && (
          <p className="text-xs text-dried-blood">{errors.embedUrl}</p>
        )}
      </div>

      {showPreview && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-bone">Preview</p>
          <MixEmbed
            url={embedUrl.trim()}
            platform={platform}
            title={draftTitle}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="mix-title" className="text-sm font-medium text-bone">
          Title *
        </label>
        <Input
          id="mix-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && (
          <p className="text-xs text-dried-blood">{errors.title}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mix-description" className="text-sm font-medium text-bone">
          Description
        </label>
        <Textarea
          id="mix-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Optional notes about this mix…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mix-platform" className="text-sm font-medium text-bone">
          Platform *
        </label>
        <select
          id="mix-platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as MixPlatform)}
          required
          className="h-11 w-full rounded-default border border-root-line bg-dark-moss px-4 text-sm text-bone outline-none focus-visible:border-fern"
          aria-invalid={Boolean(errors.platform)}
        >
          {MIX_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p as MixPlatform]}
            </option>
          ))}
        </select>
        {errors.platform && (
          <p className="text-xs text-dried-blood">{errors.platform}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-bone">Genres</span>
        <GenreTagInput value={genres} onChange={setGenres} max={10} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-bone">Cover image</p>
        {mode === "edit" && mix ? (
          <ImageUpload
            currentUrl={coverUrl}
            onUploadComplete={async (file) => {
              const url = await storageService.uploadMixCover(mix.id, file);
              setCoverUrl(url);
              return url;
            }}
            onRemove={() => setCoverUrl(null)}
            label="Upload mix cover"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => coverInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  coverInputRef.current?.click();
                }
              }}
              className={cn(
                "relative flex aspect-square w-32 cursor-pointer items-center justify-center overflow-hidden rounded-default border-2 border-dashed border-root-line transition-colors hover:border-sage-edge",
              )}
              aria-label="Upload mix cover"
            >
              {pendingCoverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pendingCoverPreview}
                  alt="Cover preview"
                  className="size-full object-cover"
                />
              ) : oembedCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={oembedCoverUrl}
                  alt="Cover from link"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-fog">
                  <ImagePlus className="size-6" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Mix cover file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onCreateCoverFile(file);
              }}
            />
            {pendingCoverPreview && (
              <button
                type="button"
                onClick={clearPendingCover}
                className="flex w-fit items-center gap-1 text-xs text-stone hover:text-bone"
              >
                <X className="size-3" />
                Remove upload
              </button>
            )}
            {!pendingCoverPreview && oembedCoverUrl && (
              <button
                type="button"
                onClick={clearOembedCoverOnly}
                className="flex w-fit items-center gap-1 text-xs text-stone hover:text-bone"
              >
                <X className="size-3" />
                Remove auto cover
              </button>
            )}
            <p className="text-xs text-fog">
              Cover from your link or an upload is saved after the mix is created.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Add mix" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => router.push(`/dj/${profileSlug}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
