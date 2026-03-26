import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetOrCreateDM = jest.fn().mockResolvedValue("c1");
const mockSend = jest.fn().mockResolvedValue(undefined);

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

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { QuickMessageDialog } from "@/components/messages/QuickMessageDialog";

describe("DJ profile quick message dialog integration", () => {
  it("shows Message button for non-own profile and opens dialog", async () => {
    const user = userEvent.setup();
    function TestSection({ isOwnProfile }: { isOwnProfile: boolean }) {
      if (isOwnProfile) return null;
      return (
        <QuickMessageDialog
          recipientId="profile-2"
          recipientName="DJ Beta"
          recipientImageUrl={null}
          trigger={<span>Message</span>}
        />
      );
    }

    render(<TestSection isOwnProfile={false} />);

    const messageButton = screen.getByRole("button", { name: /message/i });
    await user.click(messageButton);

    expect(screen.getByText(/message dj beta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message body/i)).toBeInTheDocument();
  });
});

