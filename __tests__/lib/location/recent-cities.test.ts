import type { City } from "@/types";
import { addRecentCity, readRecentCities } from "@/lib/location/recent-cities";

const a: City = {
  id: "a",
  name: "A",
  state_name: "Ma",
  state_code: "MA",
  created_at: "1",
};
const b: City = {
  id: "b",
  name: "B",
  state_name: "Tx",
  state_code: "TX",
  created_at: "1",
};

describe("recent-cities", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty list when storage empty", () => {
    expect(readRecentCities()).toEqual([]);
  });

  it("addRecentCity prepends and dedupes by id", () => {
    addRecentCity(a);
    addRecentCity(b);
    addRecentCity(a);
    expect(readRecentCities().map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("caps at 5 entries", () => {
    for (let i = 0; i < 8; i++) {
      addRecentCity({
        id: `c${i}`,
        name: `C${i}`,
        state_name: "X",
        state_code: "X",
        created_at: "1",
      });
    }
    expect(readRecentCities()).toHaveLength(5);
  });
});
