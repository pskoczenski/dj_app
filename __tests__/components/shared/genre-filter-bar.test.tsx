import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenreFilterBar } from "@/components/shared/genre-filter-bar";

jest.mock("@/hooks/use-genres", () => ({
  useGenres: () => ({
    genres: [
      {
        id: "g-house",
        name: "House",
        slug: "house",
        sort_order: 0,
        created_at: "2025-01-01",
      },
      {
        id: "g-techno",
        name: "Techno",
        slug: "techno",
        sort_order: 1,
        created_at: "2025-01-01",
      },
    ],
    loading: false,
  }),
}));

describe("GenreFilterBar", () => {
  it("renders genre chips and toggles selection via onChange", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const { rerender } = render(
      <GenreFilterBar selectedGenreIds={[]} onChange={onChange} />,
    );

    const house = screen.getByRole("button", { name: /^house$/i });
    expect(house).toHaveAttribute("aria-pressed", "false");

    await user.click(house);
    expect(onChange).toHaveBeenCalledWith(["g-house"]);

    rerender(
      <GenreFilterBar selectedGenreIds={["g-house"]} onChange={onChange} />,
    );
    expect(screen.getByRole("button", { name: /^house$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /^house$/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("shows Clear and calls onChange([]) when Clear is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <GenreFilterBar selectedGenreIds={["g-house"]} onChange={onChange} />,
    );

    await user.click(
      screen.getByRole("button", { name: /clear all genre filters/i }),
    );
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("opens + More popover with searchable genre list", async () => {
    const user = userEvent.setup();

    render(
      <GenreFilterBar selectedGenreIds={[]} onChange={jest.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: /\+ more\. open genre picker/i }),
    );

    expect(
      screen.getByRole("textbox", { name: /search genres in list/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /house/i })).toBeInTheDocument();
  });
});
