import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LineupBuilder,
  type LineupEntry,
} from "@/components/events/lineup-builder";

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    search: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
  },
}));

function makeEntry(overrides: Partial<LineupEntry> = {}): LineupEntry {
  return {
    tempId: "tmp-1",
    profileId: "user-1",
    displayName: "DJ Alpha",
    slug: "dj-alpha",
    profileImageUrl: null,
    isHeadliner: false,
    setTime: "",
    sortOrder: 0,
    ...overrides,
  };
}

describe("LineupBuilder", () => {
  it("renders the empty state when no entries", () => {
    render(<LineupBuilder value={[]} onChange={jest.fn()} />);
    expect(screen.getByText(/no djs added yet/i)).toBeInTheDocument();
  });

  it("renders lineup entries", () => {
    const entries = [
      makeEntry({ tempId: "a", displayName: "DJ Alpha", sortOrder: 0 }),
      makeEntry({
        tempId: "b",
        profileId: "user-2",
        displayName: "DJ Beta",
        slug: "dj-beta",
        sortOrder: 1,
      }),
    ];

    render(<LineupBuilder value={entries} onChange={jest.fn()} />);
    expect(screen.getByText("DJ Alpha")).toBeInTheDocument();
    expect(screen.getByText("DJ Beta")).toBeInTheDocument();
  });

  it("calls onChange without the removed entry when remove is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const entries = [
      makeEntry({ tempId: "a", displayName: "DJ Alpha", sortOrder: 0 }),
      makeEntry({
        tempId: "b",
        profileId: "user-2",
        displayName: "DJ Beta",
        slug: "dj-beta",
        sortOrder: 1,
      }),
    ];

    render(<LineupBuilder value={entries} onChange={onChange} />);

    await user.click(screen.getByLabelText("Remove DJ Alpha"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated).toHaveLength(1);
    expect(updated[0].displayName).toBe("DJ Beta");
  });

  it("calls onChange with swapped order when move down is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const entries = [
      makeEntry({ tempId: "a", displayName: "DJ Alpha", sortOrder: 0 }),
      makeEntry({
        tempId: "b",
        profileId: "user-2",
        displayName: "DJ Beta",
        slug: "dj-beta",
        sortOrder: 1,
      }),
    ];

    render(<LineupBuilder value={entries} onChange={onChange} />);

    await user.click(screen.getByLabelText("Move DJ Alpha down"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated[0].displayName).toBe("DJ Beta");
    expect(updated[1].displayName).toBe("DJ Alpha");
  });
});
