import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Root page", () => {
  it("renders the heading and tagline", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /anastomosis/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/grassroots/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("renders a main landmark", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
