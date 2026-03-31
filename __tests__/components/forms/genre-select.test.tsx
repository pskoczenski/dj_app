import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { GenreSelect } from "@/components/forms/genre-select";
import type { Genre } from "@/types";

const mockSearch = jest.fn();

jest.mock("@/lib/services/genres", () => ({
  genresService: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

function Wrapper(props: { initial?: Genre[]; max?: number }) {
  const [value, setValue] = useState<Genre[]>(props.initial ?? []);
  return (
    <GenreSelect
      label="Genres"
      value={value}
      onChange={setValue}
      maxSelections={props.max}
    />
  );
}

describe("GenreSelect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders selected genres as removable chips", () => {
    render(
      <Wrapper
        initial={[
          { id: "g1", slug: "house", name: "House" },
          { id: "g2", slug: "techno", name: "Techno" },
        ]}
      />,
    );

    expect(screen.getByText("House")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove house/i })).toBeInTheDocument();
  });

  it("typing triggers search and clicking a result adds a chip", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockSearch.mockResolvedValueOnce([{ id: "g1", slug: "house", name: "House" }]);

    render(<Wrapper />);
    await user.type(screen.getByRole("combobox", { name: /genres/i }), "ho");

    actAdvance(300);

    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith("ho", { excludeIds: [] }),
    );

    await waitFor(() =>
      expect(screen.getByRole("option", { name: "House" })).toBeInTheDocument(),
    );
    await user.click(await screen.findByRole("option", { name: "House" }));
    expect(screen.getByText("House")).toBeInTheDocument();
  });

  it("clicking × removes a genre", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper initial={[{ id: "g1", slug: "house", name: "House" }]} />);

    await user.click(screen.getByRole("button", { name: /remove house/i }));
    expect(screen.queryByText("House")).not.toBeInTheDocument();
  });

  it("already-selected genres are excluded from subsequent search calls", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockSearch
      .mockResolvedValueOnce([{ id: "g1", slug: "house", name: "House" }])
      .mockResolvedValueOnce([{ id: "g2", slug: "techno", name: "Techno" }]);

    render(<Wrapper />);
    const input = screen.getByRole("combobox", { name: /genres/i });

    await user.type(input, "ho");
    actAdvance(300);
    await user.click(await screen.findByRole("option", { name: "House" }));

    await user.type(input, "te");
    actAdvance(300);
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith("te", { excludeIds: ["g1"] }),
    );
  });

  it("when max selections reached, input hides and message shows", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockSearch.mockResolvedValueOnce([{ id: "g1", slug: "house", name: "House" }]);

    render(<Wrapper max={1} />);
    const input = screen.getByRole("combobox", { name: /genres/i });

    await user.type(input, "ho");
    actAdvance(300);
    await user.click(await screen.findByRole("option", { name: "House" }));

    expect(screen.getByText(/maximum of 1 genres reached/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /genres/i })).not.toBeInTheDocument();
  });

  it("keyboard: arrow keys navigate and Enter selects; Backspace removes last chip", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockSearch.mockResolvedValueOnce([
      { id: "g1", slug: "house", name: "House" },
      { id: "g2", slug: "hard-techno", name: "Hard Techno" },
    ]);

    render(<Wrapper />);
    const input = screen.getByRole("combobox", { name: /genres/i });

    await user.type(input, "ho");
    actAdvance(300);

    await waitFor(() =>
      expect(screen.getByRole("option", { name: "House" })).toBeInTheDocument(),
    );

    await user.keyboard("{ArrowDown}{Enter}");
    expect(await screen.findByText("Hard Techno")).toBeInTheDocument();

    // empty query + backspace removes last chip
    await user.clear(input);
    await user.keyboard("{Backspace}");
    expect(screen.queryByText("Hard Techno")).not.toBeInTheDocument();
  });
});

function actAdvance(ms: number) {
  // helper to keep tests readable
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

