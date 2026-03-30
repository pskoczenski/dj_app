import type { City } from "@/types";

export type LocationContextValue = {
  activeCity: City;
  homeCity: City;
  isExploring: boolean;
  setActiveCity: (city: City) => void;
  resetToHome: () => void;
};
