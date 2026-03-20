import { render, screen } from "@testing-library/react";
import { MixEmbed } from "@/components/mixes/mix-embed";

describe("MixEmbed", () => {
  it("renders an iframe for YouTube", () => {
    render(
      <MixEmbed
        url="https://www.youtube.com/watch?v=abc123"
        platform="youtube"
        title="My Mix"
      />,
    );
    const iframe = screen.getByTitle("My Mix");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("renders an iframe for SoundCloud", () => {
    render(
      <MixEmbed
        url="https://soundcloud.com/artist/track"
        platform="soundcloud"
        title="SC Mix"
      />,
    );
    const iframe = screen.getByTitle("SC Mix");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe.getAttribute("src")).toContain("w.soundcloud.com/player");
  });

  it("renders an iframe for Spotify", () => {
    render(
      <MixEmbed
        url="https://open.spotify.com/track/123"
        platform="spotify"
        title="Spot Mix"
      />,
    );
    const iframe = screen.getByTitle("Spot Mix");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      "https://open.spotify.com/embed/track/123",
    );
  });

  it("renders a link (not iframe) for other platform", () => {
    render(
      <MixEmbed
        url="https://example.com/mix"
        platform="other"
        title="External Mix"
      />,
    );
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/mix");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("falls back to a link if the URL host is not allowed", () => {
    render(
      <MixEmbed
        url="https://evil.com/hack"
        platform="youtube"
        title="Bad Mix"
      />,
    );
    expect(screen.queryByTitle("Bad Mix")).not.toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://evil.com/hack");
  });
});
