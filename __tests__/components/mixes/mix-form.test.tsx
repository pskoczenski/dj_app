import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MixForm } from "@/components/mixes/mix-form";
import type { Mix } from "@/types";

const mockPush = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockGetByProfile = jest.fn();
const mockSyncGenreTags = jest.fn();
const mockUploadMixCover = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/services/mixes", () => ({
  mixesService: {
    create: (...a: unknown[]) => mockCreate(...a),
    update: (...a: unknown[]) => mockUpdate(...a),
    getByProfile: (...a: unknown[]) => mockGetByProfile(...a),
  },
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    syncGenreTags: (...a: unknown[]) => mockSyncGenreTags(...a),
  },
}));

jest.mock("@/lib/services/storage", () => ({
  storageService: {
    uploadMixCover: (...a: unknown[]) => mockUploadMixCover(...a),
  },
  validateImageFile: (file: File) =>
    file.type.startsWith("image/")
      ? { valid: true }
      : { valid: false, error: "Bad file" },
}));

describe("MixForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ title: null as string | null, thumbnailUrl: null }),
    });
    mockGetByProfile.mockResolvedValue([]);
    mockCreate.mockResolvedValue({
      id: "new-mix-id",
      profile_id: "user-1",
      title: "Test",
      embed_url: "https://soundcloud.com/a/b",
      platform: "soundcloud",
      description: null,
      genres: null,
      cover_image_url: null,
      sort_order: 0,
      duration: null,
      created_at: null,
      updated_at: null,
      deleted_at: null,
    });
    mockUpdate.mockResolvedValue({});
  });

  it("blurs SoundCloud URL and sets platform + shows embed preview", async () => {
    const user = userEvent.setup();
    render(
      <MixForm mode="create" profileId="user-1" profileSlug="dj-alpha" />,
    );

    const urlInput = screen.getByLabelText(/embed url/i);
    await user.type(urlInput, "https://soundcloud.com/artist/heat");
    await user.tab();

    expect(screen.getByLabelText(/^platform/i)).toHaveValue("soundcloud");

    const iframe = await screen.findByTitle(/preview/i);
    expect(iframe.tagName).toBe("IFRAME");
  });

  it("fills title and cover preview from oEmbed after embed URL settles", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Summer Mix",
          thumbnailUrl: "https://i1.sndcdn.com/artwork-x.jpg",
        }),
    });

    render(
      <MixForm mode="create" profileId="user-1" profileSlug="dj-alpha" />,
    );

    await user.type(
      screen.getByLabelText(/embed url/i),
      "https://soundcloud.com/artist/heat",
    );
    await user.tab();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByLabelText(/^title/i)).toHaveValue("Summer Mix");
    expect(screen.getByRole("img", { name: /cover from link/i })).toHaveAttribute(
      "src",
      "https://i1.sndcdn.com/artwork-x.jpg",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/mix-oembed?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Fheat",
      ),
    );

    jest.useRealTimers();
  });

  it("leaves platform as other for unrecognized host until user changes select", async () => {
    const user = userEvent.setup();
    render(
      <MixForm mode="create" profileId="user-1" profileSlug="dj-alpha" />,
    );

    const urlInput = screen.getByLabelText(/embed url/i);
    await user.type(urlInput, "https://example.com/mix.mp3");
    await user.tab();

    expect(screen.getByLabelText(/^platform/i)).toHaveValue("other");
  });

  it("shows validation errors for empty title or embed URL", async () => {
    const user = userEvent.setup();
    render(
      <MixForm mode="create" profileId="user-1" profileSlug="dj-alpha" />,
    );

    await user.click(screen.getByRole("button", { name: /add mix/i }));

    expect(
      await screen.findByText(/embed url is required/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("submit create calls mixesService.create with correct payload", async () => {
    const user = userEvent.setup();
    render(
      <MixForm mode="create" profileId="user-1" profileSlug="dj-alpha" />,
    );

    await user.type(
      screen.getByLabelText(/embed url/i),
      "https://soundcloud.com/x/y",
    );
    await user.tab();
    await user.type(screen.getByLabelText(/^title/i), "Night Drive");

    await user.click(screen.getByRole("button", { name: /add mix/i }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: "user-1",
        title: "Night Drive",
        embed_url: "https://soundcloud.com/x/y",
        platform: "soundcloud",
        cover_image_url: null,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/dj/dj-alpha");
  });
});

describe("MixForm edit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const MOCK_MIX: Mix = {
    id: "mix-99",
    profile_id: "user-1",
    title: "Old title",
    embed_url: "https://www.youtube.com/watch?v=abc",
    platform: "youtube",
    description: "Desc",
    genres: ["techno"],
    cover_image_url: null,
    duration: null,
    sort_order: 0,
    created_at: null,
    updated_at: null,
    deleted_at: null,
  };

  it("pre-fills fields and submit calls mixesService.update", async () => {
    const user = userEvent.setup();
    render(
      <MixForm
        mode="edit"
        mix={MOCK_MIX}
        profileId="user-1"
        profileSlug="dj-alpha"
      />,
    );

    expect(screen.getByLabelText(/^title/i)).toHaveValue("Old title");
    expect(screen.getByLabelText(/embed url/i)).toHaveValue(MOCK_MIX.embed_url);

    await user.clear(screen.getByLabelText(/^title/i));
    await user.type(screen.getByLabelText(/^title/i), "New title");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(mockUpdate).toHaveBeenCalledWith(
      "mix-99",
      expect.objectContaining({
        title: "New title",
        embed_url: MOCK_MIX.embed_url,
        platform: "youtube",
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/dj/dj-alpha");
  });
});
