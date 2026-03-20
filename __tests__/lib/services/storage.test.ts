import { validateImageFile } from "@/lib/services/storage";

function makeFile(
  name: string,
  type: string,
  sizeBytes: number,
): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe("validateImageFile", () => {
  it("accepts a valid JPEG under 5MB", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it("accepts a valid PNG under 5MB", () => {
    const file = makeFile("photo.png", "image/png", 2 * 1024 * 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it("accepts a valid WebP under 5MB", () => {
    const file = makeFile("photo.webp", "image/webp", 100);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it("rejects a GIF", () => {
    const file = makeFile("anim.gif", "image/gif", 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/JPEG.*PNG.*WebP/i);
  });

  it("rejects a PDF", () => {
    const file = makeFile("doc.pdf", "application/pdf", 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
  });

  it("rejects a file over 5MB", () => {
    const file = makeFile("huge.jpg", "image/jpeg", 6 * 1024 * 1024);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/5 MB/);
  });

  it("accepts a file exactly at 5MB", () => {
    const file = makeFile("exact.jpg", "image/jpeg", 5 * 1024 * 1024);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });
});
