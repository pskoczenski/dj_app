import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CityAutocomplete } from "@/components/forms/city-autocomplete";
import type { City } from "@/types";

const mockSearch = jest.fn();

jest.mock("@/lib/services/cities", () => ({
  citiesService: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

const pdx: City = {
  id: "city-pdx",
  name: "Portland",
  state_name: "Oregon",
  state_code: "OR",
  created_at: "2025-01-01",
};

describe("CityAutocomplete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });
    mockSearch.mockResolvedValue([pdx]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders input with placeholder", () => {
    render(
      <CityAutocomplete
        id="ac-1"
        value={null}
        onChange={jest.fn()}
        placeholder="Search cities…"
      />,
    );
    expect(
      screen.getByPlaceholderText("Search cities…"),
    ).toBeInTheDocument();
  });

  it("typing triggers search and shows dropdown with results", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(<CityAutocomplete id="ac-2" value={null} onChange={onChange} />);

    await user.type(screen.getByRole("combobox"), "po");

    actAdvance(300);

    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
    expect(
      await screen.findByRole("option", { name: /portland,\s*or/i }),
    ).toBeInTheDocument();
  });

  it("clicking a result calls onChange with the selected city", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(<CityAutocomplete id="ac-3" value={null} onChange={onChange} />);

    await user.type(screen.getByRole("combobox"), "po");
    actAdvance(300);
    await screen.findByRole("option", { name: /portland/i });

    await user.click(
      screen.getByRole("option", { name: /portland,\s*or/i }),
    );
    expect(onChange).toHaveBeenCalledWith(pdx);
  });

  it('shows "No cities found" when search returns empty', async () => {
    mockSearch.mockResolvedValue([]);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CityAutocomplete id="ac-4" value={null} onChange={jest.fn()} />);

    await user.type(screen.getByRole("combobox"), "zz");
    actAdvance(300);

    expect(await screen.findByText(/no cities found/i)).toBeInTheDocument();
  });

  it("keyboard: ArrowDown highlights and Enter selects", async () => {
    jest.useRealTimers();
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CityAutocomplete id="ac-5" value={null} onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "po");
    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
    await screen.findByRole("listbox");

    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /portland/i })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(pdx);
    jest.useFakeTimers({ advanceTimers: true });
  });

  it("initial value displays without triggering search", () => {
    render(<CityAutocomplete id="ac-6" value={pdx} onChange={jest.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue("Portland, OR");
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("clearing input calls onChange(null)", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();
    render(<CityAutocomplete id="ac-7" value={pdx} onChange={onChange} />);

    const input = screen.getByRole("combobox");
    await user.clear(input);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

function actAdvance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}
