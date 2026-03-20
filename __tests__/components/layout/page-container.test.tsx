import { render, screen } from "@testing-library/react";
import { PageContainer } from "@/components/layout/page-container";

describe("PageContainer", () => {
  it("applies responsive page padding and xl container width by default", () => {
    render(<PageContainer>Content</PageContainer>);

    const el = screen.getByText("Content") as HTMLElement;
    expect(el.className).toContain("px-4");
    expect(el.className).toContain("md:px-6");
    expect(el.className).toContain("lg:px-8");
    expect(el.className).toContain("max-w-[1280px]");
  });

  it("renders a main landmark when as='main'", () => {
    render(<PageContainer as="main">Main Content</PageContainer>);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("supports alternate max widths", () => {
    render(
      <PageContainer maxWidth="lg">
        Narrow
      </PageContainer>,
    );
    const el = screen.getByText("Narrow") as HTMLElement;
    expect(el.className).toContain("max-w-[1024px]");
  });
});
