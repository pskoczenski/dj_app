import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetOrCreateDM = jest.fn();
const mockSend = jest.fn();

jest.mock("@/lib/services/conversations", () => ({
  conversationsService: {
    getOrCreateDM: (...a: unknown[]) => mockGetOrCreateDM(...a),
  },
}));

jest.mock("@/lib/services/messages", () => ({
  messagesService: {
    send: (...a: unknown[]) => mockSend(...a),
  },
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => mockToastSuccess(...a),
    error: (...a: unknown[]) => mockToastError(...a),
  },
}));

import { QuickMessageDialog } from "@/components/messages/QuickMessageDialog";

describe("QuickMessageDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDM.mockResolvedValue("c1");
    mockSend.mockResolvedValue(undefined);
  });

  it("opens dialog, auto-focuses textarea, and disables send when empty", async () => {
    const user = userEvent.setup();
    render(
      <QuickMessageDialog
        recipientId="user-2"
        recipientName="DJ Beta"
        trigger={<span>Message</span>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /message/i }));

    const textarea = screen.getByLabelText(/message body/i);
    expect(textarea).toHaveFocus();
    expect(
      screen.getByRole("button", { name: /send/i }),
    ).toBeDisabled();
  });

  it("disables send when whitespace-only", async () => {
    const user = userEvent.setup();
    render(
      <QuickMessageDialog
        recipientId="user-2"
        recipientName="DJ Beta"
        trigger={<span>Message</span>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /message/i }));
    const textarea = screen.getByLabelText(/message body/i);
    await user.type(textarea, "   ");

    expect(
      screen.getByRole("button", { name: /send/i }),
    ).toBeDisabled();
  });

  it("sends trimmed body on Send and closes with success toast", async () => {
    const user = userEvent.setup();
    render(
      <QuickMessageDialog
        recipientId="user-2"
        recipientName="DJ Beta"
        trigger={<span>Message</span>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /message/i }));
    const textarea = screen.getByLabelText(/message body/i);
    await user.type(textarea, "  Hello there  ");

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(mockGetOrCreateDM).toHaveBeenCalledWith("user-2");
    expect(mockSend).toHaveBeenCalledWith("c1", "Hello there");
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Message sent to DJ Beta",
    );

    expect(screen.queryByLabelText(/message body/i)).not.toBeInTheDocument();
  });

  it("keeps dialog open and preserves draft on error", async () => {
    const user = userEvent.setup();
    mockSend.mockRejectedValueOnce(new Error("boom"));

    render(
      <QuickMessageDialog
        recipientId="user-2"
        recipientName="DJ Beta"
        trigger={<span>Message</span>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /message/i }));
    const textarea = screen.getByLabelText(/message body/i);
    await user.type(textarea, "Draft msg");

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(mockToastError).toHaveBeenCalledWith(
      "Failed to send message. Please try again.",
    );
    const reopenedTextarea = screen.getByLabelText(/message body/i);
    expect((reopenedTextarea as HTMLTextAreaElement).value).toBe("Draft msg");
  });

  it("Cancel closes and clears textarea", async () => {
    const user = userEvent.setup();
    render(
      <QuickMessageDialog
        recipientId="user-2"
        recipientName="DJ Beta"
        trigger={<span>Message</span>}
      />,
    );

    await user.click(screen.getByRole("button", { name: /message/i }));
    const textarea = screen.getByLabelText(/message body/i);
    await user.type(textarea, "Draft msg");

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByLabelText(/message body/i)).not.toBeInTheDocument();

    // Re-open and expect empty textarea
    await user.click(screen.getByRole("button", { name: /message/i }));
    const textarea2 = screen.getByLabelText(/message body/i);
    expect((textarea2 as HTMLTextAreaElement).value).toBe("");
  });
});

