import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResetPasswordPage from "@/app/auth/reset-password/page";

const mockPush = jest.fn();
const mockGetSession = jest.fn();
const mockUpdateUser = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
          }),
      updateUser: mockUpdateUser,
    },
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lets the user update password and redirects to login", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    mockUpdateUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await screen.findByLabelText(/new password/i);

    await user.type(screen.getByLabelText(/new password/i), "newpassword123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "newpassword123",
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    expect(mockPush).toHaveBeenCalledWith("/login?reset=1");
  });

  it("shows an error when passwords do not match", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    await screen.findByLabelText(/new password/i);

    await user.type(screen.getByLabelText(/new password/i), "password-one");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "password-two",
    );

    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/passwords do not match/i);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

