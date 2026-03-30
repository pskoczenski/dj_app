import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
}));

import SearchPage from "@/app/(main)/search/page";

describe("SearchPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders search input and tab triggers", () => {
    render(<SearchPage />);
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("DJs")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Mixes")).toBeInTheDocument();
  });

  it("shows prompt text before first search", () => {
    render(<SearchPage />);
    expect(
      screen.getByText(/start typing to search/i),
    ).toBeInTheDocument();
  });

  it("debounces search — does not call service during 300ms", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPage />);

    await user.type(screen.getByLabelText("Search"), "hou");

    // Before debounce fires
    expect(mockSearchDjs).not.toHaveBeenCalled();
    expect(mockSearchEvents).not.toHaveBeenCalled();
    expect(mockSearchMixes).not.toHaveBeenCalled();
  });

  it("calls all search services after 300ms debounce", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPage />);

    await user.type(screen.getByLabelText("Search"), "house");

    // Advance past debounce
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(mockSearchDjs).toHaveBeenCalledWith("house");
    expect(mockSearchEvents).toHaveBeenCalledWith("house");
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

    render(<SearchPage />);

    await user.type(screen.getByLabelText("Search"), "house");

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(await screen.findByText("DJ House")).toBeInTheDocument();
  });
});
