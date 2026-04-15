import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/(auth)/signup/page";

const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockEnsureProfileForUser = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: mockSignUp },
  }),
}));

jest.mock("@/lib/auth/profile-bootstrap", () => ({
  ensureProfileForUser: (...args: unknown[]) => mockEnsureProfileForUser(...args),
}));

describe("SignupPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders display name, email, password, profile type, and submit", () => {
    render(<SignupPage />);

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /dj/i })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /promoter/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /venue/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /producer/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /fan/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders a link to login", () => {
    render(<SignupPage />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("calls signUp, bootstraps profile, and redirects to /home when session exists", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user-123" }, session: { access_token: "token" } },
      error: null,
    });
    mockEnsureProfileForUser.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText(/display name/i), "DJ Shadow");
    await user.type(screen.getByLabelText(/email/i), "dj@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "dj@example.com",
      password: "password123",
      options: {
        data: {
          display_name: "DJ Shadow",
          profile_type: "dj",
        },
      },
    });
    expect(mockEnsureProfileForUser).toHaveBeenCalledWith({
      userId: "user-123",
      displayName: "DJ Shadow",
      profileType: "dj",
    });
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("redirects to login confirmation flow when session is not returned", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user-123" }, session: null },
      error: null,
    });
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText(/display name/i), "DJ Shadow");
    await user.type(screen.getByLabelText(/email/i), "dj@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(mockEnsureProfileForUser).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login?created=1");
  });

  it("shows an error when auth signup fails", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered" },
    });
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText(/display name/i), "Test");
    await user.type(screen.getByLabelText(/email/i), "dup@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User already registered"
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("allows selecting a different profile type", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user-456" }, session: { access_token: "token" } },
      error: null,
    });
    mockEnsureProfileForUser.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.click(screen.getByRole("radio", { name: /promoter/i }));
    await user.type(screen.getByLabelText(/display name/i), "Night Owl");
    await user.type(screen.getByLabelText(/email/i), "promo@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(mockEnsureProfileForUser).toHaveBeenCalledWith(
      expect.objectContaining({ profileType: "promoter" }),
    );
  });
});
