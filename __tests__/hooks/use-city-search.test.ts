import { act, renderHook, waitFor } from "@testing-library/react";

const mockSearch = jest.fn();

jest.mock("@/lib/services/cities", () => ({
  citiesService: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

import { useCitySearch } from "@/hooks/use-city-search";

describe("useCitySearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not fetch when query is fewer than 2 characters", async () => {
    const { result } = renderHook(() => useCitySearch());

    act(() => {
      result.current.setQuery("a");
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("debounces search calls", async () => {
    mockSearch.mockResolvedValue([]);
    const { result } = renderHook(() => useCitySearch());

    act(() => result.current.setQuery("po"));
    act(() => result.current.setQuery("por"));
    act(() => result.current.setQuery("port"));
    act(() => {
      jest.advanceTimersByTime(249);
    });
    expect(mockSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2);
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledTimes(1));
    expect(mockSearch).toHaveBeenCalledWith("port");
  });

  it("returns results from service", async () => {
    const cities = [
      {
        id: "1",
        name: "Portland",
        state_name: "Oregon",
        state_code: "OR",
        created_at: "",
      },
    ];
    mockSearch.mockResolvedValue(cities);
    const { result } = renderHook(() => useCitySearch());

    act(() => result.current.setQuery("por"));
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(result.current.results).toEqual(cities));
  });

  it("clearResults resets query and results", async () => {
    mockSearch.mockResolvedValue([
      {
        id: "1",
        name: "Austin",
        state_name: "Texas",
        state_code: "TX",
        created_at: "",
      },
    ]);
    const { result } = renderHook(() => useCitySearch());

    act(() => result.current.setQuery("au"));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    act(() => result.current.clearResults());

    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
  });
});
