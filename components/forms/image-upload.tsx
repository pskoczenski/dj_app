"use client";

import { useRef, useState } from "react";
import { validateImageFile } from "@/lib/services/storage";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";
import { ImageCropDialog } from "@/components/forms/image-crop-dialog";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploadComplete: (file: File) => Promise<string>;
  onRemove?: () => void;
  className?: string;
  label?: string;
}

export function ImageUpload({
  currentUrl,
  onUploadComplete,
  onRemove,
  className,
  label = "Upload image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingSrc(objectUrl);
    setCropDialogOpen(true);
  }

  async function handleCropConfirm(croppedFile: File) {
    setCropDialogOpen(false);
    if (pendingSrc) {
      URL.revokeObjectURL(pendingSrc);
      setPendingSrc(null);
    }

    const previewUrl = URL.createObjectURL(croppedFile);
    setPreview(previewUrl);
    setUploading(true);

    try {
      const url = await onUploadComplete(croppedFile);
      URL.revokeObjectURL(previewUrl);
      setPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  }

  function handleCropCancel() {
    setCropDialogOpen(false);
    if (pendingSrc) {
      URL.revokeObjectURL(pendingSrc);
    }
    setPendingSrc(null);
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "relative flex aspect-square w-32 cursor-pointer items-center justify-center overflow-hidden rounded-default border-2 border-dashed border-root-line transition-colors hover:border-sage-edge",
          uploading && "pointer-events-none opacity-50",
        )}
        aria-label={label}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
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
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />

      {preview && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex w-fit items-center gap-1 text-xs text-stone hover:text-bone"
        >
          <X className="size-3" />
          Remove
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs text-dried-blood">
          {error}
        </p>
      )}

      {pendingSrc && (
        <ImageCropDialog
          open={cropDialogOpen}
          imageSrc={pendingSrc}
          originalFileName={pendingFile?.name ?? "flyer.jpg"}
          originalFileType={pendingFile?.type ?? "image/jpeg"}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
