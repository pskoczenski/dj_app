import type { ReactNode } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationProvider } from "@/lib/location/location-provider";
import type { City } from "@/types";

const mockSearchDjs = jest.fn().mockResolvedValue([]);
const mockSearchEvents = jest.fn().mockResolvedValue([]);
const mockSearchMixes = jest.fn().mockResolvedValue([]);

jest.mock("@/lib/services/search", () => ({
  searchService: {
    searchDjs: (...args: unknown[]) => mockSearchDjs(...args),
    searchEvents: (...args: unknown[]) => mockSearchEvents(...args),
    searchMixes: (...args: unknown[]) => mockSearchMixes(...args),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/search",
}));

jest.mock("@/hooks/use-genres", () => ({
  useGenres: () => ({
    genres: [
      {
        id: "genre-house",
        name: "House",
        slug: "house",
        sort_order: 0,
        created_at: "2025-01-01",
      },
    ],
    loading: false,
  }),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    user: null,
    profile: null,
    hasAuthSession: false,
    loading: false,
  }),
}));

jest.mock("@/hooks/use-liked-event-ids", () => ({
  useLikedEventIds: () => new Set<string>(),
}));

import SearchPage from "@/app/(main)/search/page";

const homeCity: City = {
  id: "city-pdx",
  name: "Portland",
  state_name: "Oregon",
  state_code: "OR",
  created_at: "2025-01-01",
};

function renderSearch(ui: ReactNode = <SearchPage />) {
  return render(
    <LocationProvider homeCity={homeCity} initialOverrideCity={null}>
      {ui}
    </LocationProvider>,
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders search input and tab triggers", () => {
    renderSearch();
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Mixes")).toBeInTheDocument();
  });

  it("shows prompt text before first search", () => {
    renderSearch();
    expect(
      screen.getByText(/start typing to search/i),
    ).toBeInTheDocument();
  });

  it("debounces search — does not call service during 300ms", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSearch();

    await user.type(screen.getByLabelText("Search"), "hou");

    // Before debounce fires
    expect(mockSearchDjs).not.toHaveBeenCalled();
    expect(mockSearchEvents).not.toHaveBeenCalled();
    expect(mockSearchMixes).not.toHaveBeenCalled();
  });

  it("calls all search services after 300ms debounce", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSearch();

    await user.type(screen.getByLabelText("Search"), "house");

    // Advance past debounce
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(mockSearchDjs).toHaveBeenCalledWith("house", {
      cityId: homeCity.id,
    });
    expect(mockSearchEvents).toHaveBeenCalledWith("house", {
      cityId: homeCity.id,
    });
    expect(mockSearchMixes).toHaveBeenCalledWith("house");
  });

  it("shows results after search completes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    mockSearchDjs.mockResolvedValueOnce([
      {
        id: "u1",
        display_name: "DJ House",
        slug: "dj-house",
        profile_image_url: null,
        city_id: "city-pdx",
        cities: {
          id: "city-pdx",
          name: "Portland",
          state_name: "Oregon",
          state_code: "OR",
          created_at: "2025-01-01",
        },
        bio: null,
        country: null,
        genres: null,
        profile_type: "dj",
        social_links: null,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        deleted_at: null,
      },
    ]);
    mockSearchEvents.mockResolvedValueOnce([]);
    mockSearchMixes.mockResolvedValueOnce([]);

    renderSearch();

    await user.type(screen.getByLabelText("Search"), "house");

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(await screen.findByText("DJ House")).toBeInTheDocument();
  });

  it("scopes DJs and events to active city by default; mixes are unscoped", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSearch();

    await user.type(screen.getByLabelText("Search"), "techno");
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(mockSearchMixes).toHaveBeenCalledWith("techno");
    expect(mockSearchMixes.mock.calls[0]?.length).toBe(1);
  });

  it("All cities passes no cityId for DJs and events", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSearch();

    await user.type(screen.getByLabelText("Search"), "house");
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    jest.clearAllMocks();

    await user.click(screen.getByRole("button", { name: /^all cities$/i }));

    await waitFor(() => {
      expect(mockSearchDjs).toHaveBeenCalledWith("house", {});
      expect(mockSearchEvents).toHaveBeenCalledWith("house", {});
      expect(mockSearchMixes).toHaveBeenCalledWith("house");
    });
  });

  it("passes genreIds to searchDjs only when a genre chip is selected", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSearch();

    await user.click(screen.getByRole("button", { name: /^house$/i }));

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(mockSearchDjs).toHaveBeenCalledWith("", {
        cityId: homeCity.id,
        genreIds: ["genre-house"],
      });
    });
    expect(mockSearchEvents).not.toHaveBeenCalled();
    expect(mockSearchMixes).not.toHaveBeenCalled();
  });

  it("composes text search with genreIds on DJs; mixes stay unfiltered by genre", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderSearch();

    await user.click(screen.getByRole("button", { name: /^house$/i }));
    await user.type(screen.getByLabelText("Search"), "mix");

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(mockSearchDjs).toHaveBeenCalledWith("mix", {
        cityId: homeCity.id,
        genreIds: ["genre-house"],
      });
      expect(mockSearchEvents).toHaveBeenCalledWith("mix", {
        cityId: homeCity.id,
      });
      expect(mockSearchMixes).toHaveBeenCalledWith("mix");
    });
    expect(mockSearchMixes.mock.calls[0]?.[1]).toBeUndefined();
  });
});
