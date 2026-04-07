import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUpload } from "@/components/forms/image-upload";

// Controllable mock: tests set `mockCropBehavior` to decide what the dialog does.
type CropBehavior = "confirm" | "cancel";
let mockCropBehavior: CropBehavior = "confirm";

jest.mock("@/components/forms/image-crop-dialog", () => ({
  ImageCropDialog: ({
    open,
    onConfirm,
    onCancel,
    originalFileName,
    originalFileType,
  }: {
    open: boolean;
    onConfirm: (f: File) => void;
    onCancel: () => void;
    imageSrc: string;
    originalFileName: string;
    originalFileType: string;
  }) => {
    React.useEffect(() => {
      if (!open) return;
      if (mockCropBehavior === "confirm") {
        const blob = new Blob([""], { type: originalFileType });
        onConfirm(new File([blob], originalFileName, { type: originalFileType }));
      } else {
        onCancel();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    return null;
  },
}));

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

function getFileInput(): HTMLInputElement {
  return document.querySelector("input[type='file']") as HTMLInputElement;
}

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:preview-url");
  global.URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  mockCropBehavior = "confirm";
});

describe("ImageUpload", () => {
  it("renders an upload area with a file input", () => {
    render(
      <ImageUpload onUploadComplete={jest.fn()} label="Upload avatar" />,
    );
    expect(screen.getByRole("button", { name: "Upload avatar" })).toBeInTheDocument();
    expect(getFileInput()).toBeInTheDocument();
  });

  it("calls onUploadComplete after crop confirm with a valid file", async () => {
    const onUpload = jest.fn().mockResolvedValue("https://cdn/avatar.jpg");
    const user = userEvent.setup();

    render(<ImageUpload onUploadComplete={onUpload} label="Upload avatar" />);

    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    await user.upload(getFileInput(), file);

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });
    expect(onUpload.mock.calls[0][0]).toBeInstanceOf(File);
  });

  it("does not call onUploadComplete when crop is cancelled", async () => {
    mockCropBehavior = "cancel";
    const onUpload = jest.fn();

    render(<ImageUpload onUploadComplete={onUpload} label="Upload avatar" />);

    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    // Give effects time to run and confirm onUpload was never called.
    await waitFor(() => {
      expect(onUpload).not.toHaveBeenCalled();
    });
  });

  it("shows an error for an invalid file type", async () => {
    const onUpload = jest.fn();

    render(<ImageUpload onUploadComplete={onUpload} label="Upload avatar" />);

    const file = makeFile("doc.pdf", "application/pdf", 1024);
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/JPEG.*PNG.*WebP/i);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("shows an error for an oversize file", async () => {
    const onUpload = jest.fn();

    render(<ImageUpload onUploadComplete={onUpload} label="Upload avatar" />);

    const file = makeFile("huge.jpg", "image/jpeg", 6 * 1024 * 1024);
    fireEvent.change(getFileInput(), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/5 MB/);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("shows the current image if provided", () => {
    render(
      <ImageUpload
        currentUrl="https://cdn/existing.jpg"
        onUploadComplete={jest.fn()}
        label="Upload avatar"
      />,
    );
    expect(screen.getByAltText("Preview")).toHaveAttribute(
      "src",
      "https://cdn/existing.jpg",
    );
  });
});
