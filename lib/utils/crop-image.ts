function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function cropImageToFile(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  fileName: string,
  fileType: string,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // JPEG has no alpha channel — fill with the app's darkest surface colour so
  // areas outside the image (when zoomed out) don't become black.
  // PNG and WebP support transparency, so no fill is needed.
  if (fileType === "image/jpeg") {
    ctx.fillStyle = "#161310";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas toBlob failed"));
        return;
      }
      resolve(new File([blob], fileName, { type: fileType }));
    }, fileType);
  });
}
