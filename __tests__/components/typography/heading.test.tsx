import { render, screen } from "@testing-library/react";
import { Heading } from "@/components/typography/heading";

describe("Heading", () => {
  it("renders an h2 by default", () => {
    render(<Heading>Section Title</Heading>);
    const el = screen.getByRole("heading", { level: 2, name: /section title/i });
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-level", "2");
  });

  it.each([1, 2, 3, 4] as const)(
    "renders h%i with the correct display heading class",
    (level) => {
      render(<Heading level={level}>Heading {level}</Heading>);
      const el = screen.getByRole("heading", { level });

      if (level === 1) {
        expect(el.className).toContain("heading-hero");
      } else if (level === 2 || level === 3) {
        expect(el.className).toContain("heading-section");
      } else {
        expect(el.className).toContain("heading-subtle");
      }
    },
  );

  it("applies text-bone to all levels", () => {
    render(<Heading level={3}>Test</Heading>);
    expect(screen.getByRole("heading", { level: 3 }).className).toContain(
      "text-bone",
    );
  });

  it("allows overriding the HTML tag with `as`", () => {
    render(
      <Heading level={1} as={3}>
        Visually h1, semantically h3
      </Heading>,
    );
    const el = screen.getByRole("heading", { level: 3 });
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-level", "1");
    expect(el.className).toContain("heading-hero");
  });

  it("merges custom className", () => {
    render(
      <Heading className="mt-8">Custom</Heading>,
    );
    expect(screen.getByRole("heading").className).toContain("mt-8");
  });
});
