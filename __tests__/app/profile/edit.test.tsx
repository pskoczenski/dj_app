import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfilePage from "@/app/(main)/profile/edit/page";

const mockPush = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue({});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: { id: "user-1", displayName: "DJ Shadow", slug: "dj-shadow", avatarUrl: null, profileType: "dj" },
    loading: false,
  }),
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    getById: jest.fn().mockResolvedValue({
      id: "user-1",
      display_name: "DJ Shadow",
      slug: "dj-shadow",
      bio: "Bio text",
      city: "Brooklyn",
      state: "NY",
      country: "US",
      genres: ["house"],
      profile_type: "dj",
      profile_image_url: null,
      social_links: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      deleted_at: null,
    }),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("EditProfilePage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the edit form with profile data", async () => {
    render(<EditProfilePage />);

    expect(
      await screen.findByRole("heading", { name: /edit profile/i })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/display name/i);
    expect(nameInput).toHaveValue("DJ Shadow");
  });

  it("renders genre tags from profile", async () => {
    render(<EditProfilePage />);
    expect(await screen.findByText("house")).toBeInTheDocument();
  });

  it("shows profile type radios", async () => {
    render(<EditProfilePage />);
    await screen.findByLabelText(/display name/i);

    expect(screen.getByRole("radio", { name: /dj/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /promoter/i })).not.toBeChecked();
  });

  it("submits the form and redirects", async () => {
    const user = userEvent.setup();
    render(<EditProfilePage />);
    await screen.findByLabelText(/display name/i);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ display_name: "DJ Shadow" }),
    );
  });
});
