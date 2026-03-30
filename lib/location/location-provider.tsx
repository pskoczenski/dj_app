"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { City } from "@/types";
import { clearLocationCookie, setLocationCookie } from "@/lib/location/cookie";
import type { LocationContextValue } from "@/lib/location/types";

const LocationContext = createContext<LocationContextValue | null>(null);

type LocationProviderProps = {
  children: React.ReactNode;
  homeCity: City;
  initialOverrideCity: City | null;
};

export function LocationProvider({
  children,
  homeCity,
  initialOverrideCity,
}: LocationProviderProps) {
  const [activeCity, setActiveCityState] = useState<City>(
    () => initialOverrideCity ?? homeCity,
  );

  const setActiveCity = useCallback((city: City) => {
    setActiveCityState(city);
    setLocationCookie(city.id);
  }, []);

  const resetToHome = useCallback(() => {
    setActiveCityState(homeCity);
    clearLocationCookie();
  }, [homeCity]);

  const value = useMemo<LocationContextValue>(
    () => ({
      activeCity,
      homeCity,
      isExploring: activeCity.id !== homeCity.id,
      setActiveCity,
      resetToHome,
    }),
    [activeCity, homeCity, setActiveCity, resetToHome],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextValue | null {
  return useContext(LocationContext);
}
