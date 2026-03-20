import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/(auth)/signup/page";

const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockInsert = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: mockSignUp },
    from: () => ({ insert: mockInsert }),
  }),
}));

jest.mock("@/lib/utils/slug", () => ({
  generateUniqueSlug: jest.fn().mockResolvedValue("dj-shadow"),
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

  it("calls signUp, inserts profile, and redirects on success", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockInsert.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText(/display name/i), "DJ Shadow");
    await user.type(screen.getByLabelText(/email/i), "dj@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "dj@example.com",
      password: "password123",
    });
    expect(mockInsert).toHaveBeenCalledWith({
      id: "user-123",
      display_name: "DJ Shadow",
      slug: "dj-shadow",
      profile_type: "dj",
    });
    expect(mockPush).toHaveBeenCalledWith("/home");
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
      data: { user: { id: "user-456" } },
      error: null,
    });
    mockInsert.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.click(screen.getByRole("radio", { name: /promoter/i }));
    await user.type(screen.getByLabelText(/display name/i), "Night Owl");
    await user.type(screen.getByLabelText(/email/i), "promo@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ profile_type: "promoter" })
    );
  });
});
