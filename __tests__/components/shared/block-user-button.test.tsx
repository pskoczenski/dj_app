import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetBlockStatus = jest.fn();
const mockBlockUser = jest.fn();
const mockUnblockUser = jest.fn();

jest.mock("@/lib/services/blocks", () => ({
  blocksService: {
    getBlockStatus: (...args: unknown[]) => mockGetBlockStatus(...args),
    blockUser: (...args: unknown[]) => mockBlockUser(...args),
    unblockUser: (...args: unknown[]) => mockUnblockUser(...args),
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { BlockUserButton } from "@/components/shared/block-user-button";

describe("BlockUserButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBlockStatus.mockResolvedValue({ blockedByMe: false, blockedMe: false });
    mockBlockUser.mockResolvedValue(undefined);
    mockUnblockUser.mockResolvedValue(undefined);
  });

  it("blocks and unblocks", async () => {
    const user = userEvent.setup();
    render(<BlockUserButton blockedId="user-2" />);

    const blockBtn = await screen.findByRole("button", { name: /block/i });
    await user.click(blockBtn);
    expect(mockBlockUser).toHaveBeenCalledWith("user-2");

    const unblockBtn = await screen.findByRole("button", { name: /unblock/i });
    await user.click(unblockBtn);
    expect(mockUnblockUser).toHaveBeenCalledWith("user-2");
  });
});

