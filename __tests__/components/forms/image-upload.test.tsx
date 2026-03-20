import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUpload } from "@/components/forms/image-upload";

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

describe("ImageUpload", () => {
  it("renders an upload area with a file input", () => {
    render(
      <ImageUpload onUploadComplete={jest.fn()} label="Upload avatar" />,
    );
    expect(screen.getByRole("button", { name: "Upload avatar" })).toBeInTheDocument();
    expect(getFileInput()).toBeInTheDocument();
  });

  it("calls onUploadComplete when a valid file is selected", async () => {
    const onUpload = jest.fn().mockResolvedValue("https://cdn/avatar.jpg");
    const user = userEvent.setup();

    render(<ImageUpload onUploadComplete={onUpload} label="Upload avatar" />);

    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    await user.upload(getFileInput(), file);

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });
    expect(onUpload).toHaveBeenCalledWith(file);
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
