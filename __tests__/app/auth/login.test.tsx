import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

const mockPush = jest.fn();
const mockSignIn = jest.fn();
const mockSignInOAuth = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockEnsureProfileForUser = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("redirect=/events"),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signInWithOAuth: mockSignInOAuth,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

jest.mock("@/lib/auth/profile-bootstrap", () => ({
  ensureProfileForUser: (...args: unknown[]) => mockEnsureProfileForUser(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders email, password fields and submit button", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });

  it("renders a link to signup", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("calls signInWithPassword, ensures profile, and redirects on success", async () => {
    mockSignIn.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          email: "test@example.com",
          user_metadata: { display_name: "DJ Test", profile_type: "dj" },
        },
      },
      error: null,
    });
    mockEnsureProfileForUser.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockSignIn).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockEnsureProfileForUser).toHaveBeenCalledWith({
      userId: "user-1",
      displayName: "DJ Test",
      profileType: "dj",
    });
    expect(mockPush).toHaveBeenCalledWith("/events");
  });

  it("shows an error message on auth failure", async () => {
    mockSignIn.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid login credentials"
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("has a Continue with Google button", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /google/i })
    ).toBeInTheDocument();
  });

  it("opens forgot-password dialog and sends reset email via Supabase", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();

    const resetEmailInput = within(dialog).getByLabelText(/^email$/i);
    await user.clear(resetEmailInput);
    await user.type(resetEmailInput, "recover@example.com");
    await user.click(
      within(dialog).getByRole("button", { name: /send reset link/i }),
    );

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "recover@example.com",
      { redirectTo: "http://localhost/auth/reset-password" },
    );
    expect(
      await within(dialog).findByText(/check your email for the password reset link/i),
    ).toBeInTheDocument();
  });
});
