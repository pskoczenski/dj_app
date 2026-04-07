"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cropImageToFile } from "@/lib/utils/crop-image";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  originalFileName: string;
  originalFileType: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

export function ImageCropDialog({
  open,
  imageSrc,
  originalFileName,
  originalFileType,
  onConfirm,
  onCancel,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
    },
    [],
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const file = await cropImageToFile(
        imageSrc,
        croppedAreaPixels,
        originalFileName,
        originalFileType,
      );
      onConfirm(file);
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Crop Flyer Image</DialogTitle>
          <DialogDescription>
            Drag to reposition · scroll or pinch to zoom
          </DialogDescription>
        </DialogHeader>

        {/* Cropper — must have an explicit height and position:relative */}
        <div className="relative mx-4 mt-4 h-64 overflow-hidden rounded-lg bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={0.1}
            aspect={2}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Zoom slider — min 0.1 allows zooming out past the image edges */}
        <div className="flex items-center gap-3 px-4 pb-2 pt-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-mb-turquoise-mid"
            aria-label="Zoom"
          />
        </div>

        <DialogFooter className="px-4 pb-4 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={applying}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || applying}
          >
            {applying ? "Applying…" : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
