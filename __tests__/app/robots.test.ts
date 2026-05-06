import robots from "@/app/robots";

describe("robots.txt policy", () => {
  it("disallows crawling", () => {
    expect(robots()).toEqual({
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    });
  });
});

