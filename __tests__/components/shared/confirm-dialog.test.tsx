import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

describe("ConfirmDialog", () => {
  const setup = () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger="Delete"
        title="Are you sure?"
        description="This cannot be undone."
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
        onConfirm={onConfirm}
      />
    );
    return { onConfirm, user };
  };

  it("does not show dialog content before trigger is clicked", () => {
    setup();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("opens the dialog when trigger is clicked", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("fires onConfirm when confirm button is clicked", async () => {
    const { onConfirm, user } = setup();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(
      await screen.findByRole("button", { name: /yes, delete/i })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
