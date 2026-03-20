import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenreTagInput } from "@/components/forms/genre-tag-input";

describe("GenreTagInput", () => {
  const setup = (tags: string[] = []) => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <GenreTagInput value={tags} onChange={onChange} placeholder="Add genre…" />
    );
    return { onChange, user };
  };

  it("renders existing tags as badges", () => {
    setup(["house", "techno"]);
    expect(screen.getByText("house")).toBeInTheDocument();
    expect(screen.getByText("techno")).toBeInTheDocument();
  });

  it("adds a tag when pressing Enter", async () => {
    const { onChange, user } = setup();
    const input = screen.getByPlaceholderText("Add genre…");

    await user.type(input, "jungle{Enter}");

    expect(onChange).toHaveBeenCalledWith(["jungle"]);
  });

  it("adds a tag when pressing comma", async () => {
    const { onChange, user } = setup();
    const input = screen.getByPlaceholderText("Add genre…");

    await user.type(input, "dnb,");

    expect(onChange).toHaveBeenCalledWith(["dnb"]);
  });

  it("removes a tag when clicking the remove button", async () => {
    const { onChange, user } = setup(["house", "techno"]);

    await user.click(screen.getByLabelText("Remove house"));

    expect(onChange).toHaveBeenCalledWith(["techno"]);
  });

  it("does not add duplicate tags", async () => {
    const { onChange, user } = setup(["house"]);
    const input = screen.getByPlaceholderText("Add genre…");

    await user.type(input, "house{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });
});
