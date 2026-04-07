import { cropImageToFile } from "@/lib/utils/crop-image";

// jsdom doesn't implement canvas APIs — provide minimal stubs.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: "",
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.toBlob = function (
    callback: BlobCallback,
    type?: string,
  ) {
    callback(new Blob(["mock-image-data"], { type: type ?? "image/jpeg" }));
  };

  // Stub Image to resolve immediately with a minimal object.
  global.Image = class {
    crossOrigin = "";
    onload: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    private _src = "";
    set src(value: string) {
      this._src = value;
      // Trigger onload asynchronously (mirrors real Image behaviour).
      Promise.resolve().then(() => this.onload?.());
    }
    get src() {
      return this._src;
    }
  } as unknown as typeof Image;
});

describe("cropImageToFile", () => {
  it("returns a File with the correct name and type", async () => {
    const result = await cropImageToFile(
      "data:image/jpeg;base64,/9j/",
      { x: 0, y: 0, width: 100, height: 50 },
      "flyer.jpg",
      "image/jpeg",
    );
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("flyer.jpg");
    expect(result.type).toBe("image/jpeg");
  });

  it("preserves the mime type for PNG files", async () => {
    const result = await cropImageToFile(
      "data:image/png;base64,abc",
      { x: 10, y: 10, width: 200, height: 100 },
      "cover.png",
      "image/png",
    );
    expect(result.type).toBe("image/png");
    expect(result.name).toBe("cover.png");
  });
});
