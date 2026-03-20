import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickCreateMenu } from "@/components/layout/quick-create-menu";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("QuickCreateMenu", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the + trigger button", () => {
    render(<QuickCreateMenu />);
    expect(screen.getByLabelText("Quick create")).toBeInTheDocument();
  });

  it("opens menu and Create Event navigates to /events/create", async () => {
    const user = userEvent.setup();
    render(<QuickCreateMenu />);

    await user.click(screen.getByLabelText("Quick create"));

    const createEventBtn = await screen.findByText("Create Event");
    await user.click(createEventBtn);

    expect(mockPush).toHaveBeenCalledWith("/events/create");
  });

  it("opens menu and Add Mix navigates to /profile/edit#mixes", async () => {
    const user = userEvent.setup();
    render(<QuickCreateMenu />);

    await user.click(screen.getByLabelText("Quick create"));

    const addMixBtn = await screen.findByText("Add Mix");
    await user.click(addMixBtn);

    expect(mockPush).toHaveBeenCalledWith("/profile/edit#mixes");
  });
});
