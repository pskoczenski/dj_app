import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Root page", () => {
  it("renders the heading and tagline", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /dj network/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/grassroots/i)).toBeInTheDocument();
  });

  it("renders a main landmark", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
