import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { LocationProvider } from "@/lib/location/location-provider";
import { useLocation } from "@/hooks/use-location";
import type { City } from "@/types";

const home: City = {
  id: "city-pdx",
  name: "Portland",
  state_name: "Oregon",
  state_code: "OR",
  created_at: "2025-01-01",
};

describe("useLocation", () => {
  it("throws when used outside LocationProvider", () => {
    expect(() => {
      renderHook(() => useLocation());
    }).toThrow(/useLocation must be used within LocationProvider/);
  });

  it("returns context when inside LocationProvider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <LocationProvider homeCity={home} initialOverrideCity={null}>
        {children}
      </LocationProvider>
    );

    const { result } = renderHook(() => useLocation(), { wrapper });
    expect(result.current.activeCity.id).toBe(home.id);
    expect(result.current.homeCity.id).toBe(home.id);
    expect(result.current.isExploring).toBe(false);
    expect(typeof result.current.setActiveCity).toBe("function");
    expect(typeof result.current.resetToHome).toBe("function");
  });
});
