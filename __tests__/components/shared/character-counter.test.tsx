import { render, screen } from "@testing-library/react";
import { CharacterCounter } from "@/components/shared/character-counter";

describe("CharacterCounter", () => {
  it("shows remaining characters", () => {
    render(<CharacterCounter value="hello" max={20} />);
    expect(screen.getByText("15 / 20")).toBeInTheDocument();
  });

  it("shows 0 remaining at the limit", () => {
    render(<CharacterCounter value="12345" max={5} />);
    expect(screen.getByText("0 / 5")).toBeInTheDocument();
  });

  it("shows negative remaining when over the limit", () => {
    render(<CharacterCounter value="123456" max={5} />);
    expect(screen.getByText("-1 / 5")).toBeInTheDocument();
  });
});
