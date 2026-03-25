import { createClient } from "@/lib/supabase/client";

export const BUCKETS = {
  profileImages: "profile-images",
  eventFlyers: "event-flyers",
  mixCovers: "mix-covers",
} as const;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadValidation {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): UploadValidation {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File must be JPEG, PNG, or WebP." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "File must be 5 MB or smaller." };
  }
  return { valid: true };
}

function fileExtension(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
}

async function upload(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function uploadProfileImage(
  userId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/avatar.${fileExtension(file)}`;
  return upload(BUCKETS.profileImages, path, file);
}

export async function uploadEventFlyer(
  eventId: string,
  file: File,
): Promise<string> {
  const path = `${eventId}/flyer.${fileExtension(file)}`;
  return upload(BUCKETS.eventFlyers, path, file);
}

/** Upload before the event exists; path prefix must be auth user id (see storage RLS). */
export async function uploadEventFlyerDraft(
  userId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/draft-flyer.${fileExtension(file)}`;
  return upload(BUCKETS.eventFlyers, path, file);
}

export async function uploadMixCover(
  mixId: string,
  file: File,
): Promise<string> {
  const path = `${mixId}/cover.${fileExtension(file)}`;
  return upload(BUCKETS.mixCovers, path, file);
}

export async function deleteFile(
  bucket: string,
  path: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export const storageService = {
  uploadProfileImage,
  uploadEventFlyer,
  uploadEventFlyerDraft,
  uploadMixCover,
  deleteFile,
  validateImageFile,
};
