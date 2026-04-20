import { render } from "@testing-library/react";
import { TypingDots } from "@/components/messages/typing-dots";

describe("TypingDots", () => {
  it("renders animated dot spans for default motion preference", () => {
    const { container } = render(<TypingDots />);
    expect(container.querySelectorAll(".animate-typing-dot")).toHaveLength(3);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
