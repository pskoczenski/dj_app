import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MixCard } from "@/components/mixes/mix-card";
import type { Mix } from "@/types";

const MOCK_MIX: Mix = {
  id: "mix-1",
  title: "Summer Vibes",
  embed_url: "https://soundcloud.com/artist/summer-vibes",
  platform: "soundcloud",
  profile_id: "user-1",
  description: "A chill summer mix.",
  genres: ["house", "deep house"],
  cover_image_url: null,
  duration: "1:32:00",
  sort_order: 0,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  deleted_at: null,
};

describe("MixCard", () => {
  it("renders the mix title and platform badge", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("Summer Vibes")).toBeInTheDocument();
    expect(screen.getByText("SoundCloud")).toBeInTheDocument();
  });

  it("renders genre badges", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("house")).toBeInTheDocument();
    expect(screen.getByText("deep house")).toBeInTheDocument();
  });

  it("renders duration", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("1:32:00")).toBeInTheDocument();
  });

  it("does not show embed when collapsed", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(screen.queryByTitle("Summer Vibes")).not.toBeInTheDocument();
  });

  it("shows embed when expanded", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={true} onToggle={jest.fn()} />,
    );
    const iframe = screen.getByTitle("Summer Vibes");
    expect(iframe.tagName).toBe("IFRAME");
  });

  it("shows description when expanded", () => {
    render(
      <MixCard mix={MOCK_MIX} expanded={true} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("A chill summer mix.")).toBeInTheDocument();
  });

  it("calls onToggle when title button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={onToggle} />,
    );

    await user.click(
      screen.getByRole("button", { name: /summer vibes/i }),
    );
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("has aria-expanded on the toggle button", () => {
    const { rerender } = render(
      <MixCard mix={MOCK_MIX} expanded={false} onToggle={jest.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /summer vibes/i }),
    ).toHaveAttribute("aria-expanded", "false");

    rerender(
      <MixCard mix={MOCK_MIX} expanded={true} onToggle={jest.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /summer vibes/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
