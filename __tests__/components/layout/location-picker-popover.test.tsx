import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationProvider } from "@/lib/location/location-provider";
import { LocationPickerPopover } from "@/components/layout/location-picker-popover";
import type { City } from "@/types";

const mockSearch = jest.fn();

jest.mock("@/lib/services/cities", () => ({
  citiesService: {
    search: (...a: unknown[]) => mockSearch(...a),
  },
}));

const portland: City = {
  id: "city-pdx",
  name: "Portland",
  state_name: "Oregon",
  state_code: "OR",
  created_at: "2025-01-01",
};

const austin: City = {
  id: "city-atx",
  name: "Austin",
  state_name: "Texas",
  state_code: "TX",
  created_at: "2025-01-01",
};

function advanceTimers(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("LocationPickerPopover", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("shows current location when opened", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland,\s*or/i,
      }),
    );
    expect(await screen.findByText(/Portland,\s*Oregon/i)).toBeInTheDocument();
    expect(screen.getByText(/Your home city/i)).toBeInTheDocument();
  });

  it("shows Back to home only when exploring", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={austin}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: austin,\s*tx/i,
      }),
    );
    expect(
      await screen.findByRole("button", { name: /switch back to your home city,\s*portland/i }),
    ).toBeInTheDocument();
  });

  it("Back to home calls reset and closes popover", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={austin}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: austin,\s*tx/i,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /switch back to your home city/i,
      }),
    );

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(/explore another city/i),
      ).not.toBeInTheDocument(),
    );
  });

  it("typing search shows results and picking calls setActiveCity flow", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    mockSearch.mockResolvedValue([austin]);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland,\s*or/i,
      }),
    );
    const input = screen.getByPlaceholderText(/explore another city/i);
    await user.type(input, "au");
    advanceTimers(300);

    const opt = await screen.findByRole("option", { name: /austin,\s*texas/i });
    await user.click(opt);

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(/explore another city/i),
      ).not.toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", {
        name: /current location: austin,\s*tx/i,
      }),
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows "No cities found" for empty results', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    mockSearch.mockResolvedValue([]);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland,\s*or/i,
      }),
    );
    await user.type(screen.getByPlaceholderText(/explore another city/i), "zz");
    advanceTimers(300);

    expect(await screen.findByText(/no cities found/i)).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("clears search when popover closes", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    mockSearch.mockResolvedValue([]);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland,\s*or/i,
      }),
    );
    const input = screen.getByPlaceholderText(/explore another city/i);
    await user.type(input, "zz");
    advanceTimers(300);
    await screen.findByText(/no cities found/i);

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(/explore another city/i),
      ).not.toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland,\s*or/i,
      }),
    );
    expect(screen.getByPlaceholderText(/explore another city/i)).toHaveValue("");

    jest.useRealTimers();
  });

  it("recent cities section lists stored cities", async () => {
    window.localStorage.setItem(
      "dj_recent_cities",
      JSON.stringify([austin]),
    );
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationPickerPopover trigger={<span>Open</span>} />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland,\s*or/i,
      }),
    );
    expect(await screen.findByText(/Recent/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /austin,\s*texas/i }),
    ).toBeInTheDocument();
  });
});
