/**
 * @jest-environment jsdom
 */

import {
  queryVisibleFtueAnchor,
  waitForVisibleFtueAnchor,
} from "@/lib/onboarding/ftue-dom";

describe("queryVisibleFtueAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns the first visible element matching data-ftue", () => {
    const hidden = document.createElement("button");
    hidden.setAttribute("data-ftue", "x");
    hidden.style.display = "none";
    document.body.appendChild(hidden);

    const visible = document.createElement("button");
    visible.setAttribute("data-ftue", "x");
    document.body.appendChild(visible);

    expect(queryVisibleFtueAnchor("x")).toBe(visible);
  });

  it("returns null when no visible match", () => {
    const hidden = document.createElement("span");
    hidden.setAttribute("data-ftue", "y");
    hidden.style.display = "none";
    document.body.appendChild(hidden);

    expect(queryVisibleFtueAnchor("y")).toBeNull();
  });
});

describe("waitForVisibleFtueAnchor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves when a visible node appears within timeout", async () => {
    const p = waitForVisibleFtueAnchor("late", { timeoutMs: 500, intervalMs: 10 });

    window.setTimeout(() => {
      const el = document.createElement("div");
      el.setAttribute("data-ftue", "late");
      document.body.appendChild(el);
    }, 40);

    const el = await p;
    expect(el).not.toBeNull();
    expect(el?.getAttribute("data-ftue")).toBe("late");
  });

  it("resolves null after timeout when anchor never appears", async () => {
    const el = await waitForVisibleFtueAnchor("missing", {
      timeoutMs: 80,
      intervalMs: 20,
    });
    expect(el).toBeNull();
  });
});
