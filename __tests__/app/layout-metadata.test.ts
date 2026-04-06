import { metadata } from "@/app/layout";

describe("root layout metadata", () => {
  it("uses Mirrorball naming and manifesto description", () => {
    expect(metadata.title).toMatchObject({
      default: "Mirrorball",
      template: "%s — Mirrorball",
    });
    expect(metadata.description).toContain("dance floor");
    expect(metadata.openGraph).toMatchObject({
      title: "Mirrorball",
      siteName: "Mirrorball",
    });
  });
});
