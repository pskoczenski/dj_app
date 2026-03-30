import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationProvider } from "@/lib/location/location-provider";
import { LocationIndicator } from "@/components/layout/location-indicator";
import type { City } from "@/types";

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

describe("LocationIndicator", () => {
  it("renders map pin and active city label on desktop viewport class", () => {
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationIndicator />
      </LocationProvider>,
    );

    expect(
      screen.getByRole("button", {
        name: /current location: portland,\s*or\. click to change/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Portland,\s*OR/i)).toBeInTheDocument();
  });

  it("shows exploring cue when active city differs from home", () => {
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={austin}>
        <LocationIndicator />
      </LocationProvider>,
    );

    expect(screen.getByText(/Exploring outside your home city/i)).toBeInTheDocument();
    expect(screen.getByText(/Austin,\s*TX/i)).toBeInTheDocument();
  });

  it("does not show exploring sr-only text when on home city", () => {
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationIndicator />
      </LocationProvider>,
    );

    expect(
      screen.queryByText(/Exploring outside your home city/i),
    ).not.toBeInTheDocument();
  });

  it("clicking opens the location popover", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <LocationIndicator />
      </LocationProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /current location: portland/i,
      }),
    );

    expect(await screen.findByText(/Current location/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/explore another city/i)).toBeInTheDocument();
  });
});
