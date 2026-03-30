import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LocationProvider,
  useLocationContext,
} from "@/lib/location/location-provider";
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

let writtenCookies: string[] = [];

jest.mock("@/lib/location/cookie", () => ({
  setLocationCookie: (id: string) => {
    writtenCookies.push(`set:${id}`);
  },
  clearLocationCookie: () => {
    writtenCookies.push("clear");
  },
}));

function Probe() {
  const ctx = useLocationContext()!;
  return (
    <span data-testid="probe">
      {ctx.activeCity.name}:{ctx.isExploring ? "y" : "n"}
    </span>
  );
}

function SetAustinButton() {
  const ctx = useLocationContext()!;
  return (
    <button type="button" onClick={() => ctx.setActiveCity(austin)}>
      go
    </button>
  );
}

function ResetButton() {
  const ctx = useLocationContext()!;
  return (
    <button type="button" onClick={() => ctx.resetToHome()}>
      reset
    </button>
  );
}

describe("LocationProvider", () => {
  beforeEach(() => {
    writtenCookies = [];
  });

  it("without override: active equals home, not exploring", () => {
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Probe />
      </LocationProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("Portland:n");
  });

  it("with override: active is override and exploring", () => {
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={austin}>
        <Probe />
      </LocationProvider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("Austin:y");
  });

  it("setActiveCity updates active and writes cookie", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={null}>
        <Probe />
        <SetAustinButton />
      </LocationProvider>,
    );

    await user.click(screen.getByRole("button", { name: "go" }));
    expect(screen.getByTestId("probe")).toHaveTextContent("Austin:y");
    expect(writtenCookies).toEqual(["set:city-atx"]);
  });

  it("resetToHome restores home and clears cookie", async () => {
    const user = userEvent.setup();
    render(
      <LocationProvider homeCity={portland} initialOverrideCity={austin}>
        <Probe />
        <ResetButton />
      </LocationProvider>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent("Austin:y");
    await user.click(screen.getByRole("button", { name: "reset" }));
    expect(screen.getByTestId("probe")).toHaveTextContent("Portland:n");
    expect(writtenCookies).toEqual(["clear"]);
  });
});
