/**
 * @jest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import type { Profile } from "@/types";
import { FtueTour } from "@/components/onboarding/ftue-tour";
import { profilesService } from "@/lib/services/profiles";

const mockPush = jest.fn();
const mockHighlight = jest.fn();
const mockDestroy = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("driver.js", () => ({
  driver: jest.fn(() => ({
    highlight: (...args: unknown[]) => mockHighlight(...args),
    destroy: () => mockDestroy(),
  })),
}));

jest.mock("@/lib/onboarding/ftue-dom", () => ({
  waitForVisibleFtueAnchor: jest.fn(() => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return Promise.resolve(el);
  }),
}));

jest.mock("@/lib/services/profiles", () => ({
  profilesService: {
    update: jest.fn(() => Promise.resolve({})),
  },
}));

function baseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    display_name: "DJ Test",
    slug: "dj-test",
    bio: null,
    city_id: "00000000-0000-0000-0000-000000000001",
    country: null,
    created_at: null,
    deleted_at: null,
    ftue_completed_at: null,
    genre_ids: [],
    profile_image_url: null,
    profile_type: "dj",
    social_links: {},
    updated_at: null,
    ...overrides,
  };
}

describe("FtueTour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("does not highlight when FTUE already completed", async () => {
    render(
      <FtueTour
        profile={baseProfile({ ftue_completed_at: "2024-01-01T00:00:00.000Z" })}
        userLoading={false}
        refetch={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockHighlight).not.toHaveBeenCalled();
    });
    expect(profilesService.update).not.toHaveBeenCalled();
  });

  it("starts the tour and calls driver highlight when eligible", async () => {
    render(
      <FtueTour
        profile={baseProfile()}
        userLoading={false}
        refetch={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockHighlight).toHaveBeenCalled();
    });
  });

  it("does not start while user profile is loading", () => {
    render(
      <FtueTour profile={null} userLoading refetch={jest.fn()} />,
    );

    expect(mockHighlight).not.toHaveBeenCalled();
  });
});
