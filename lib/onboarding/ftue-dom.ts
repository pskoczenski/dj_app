/**
 * First-time tour: multiple layout nodes can share the same `data-ftue` value
 * (e.g. desktop vs mobile nav). Return the first visible match.
 */
export function queryVisibleFtueAnchor(dataFtue: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(
    `[data-ftue="${CSS.escape(dataFtue)}"]`,
  );
  for (const el of nodes) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") {
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return el;
    }
    // JSDOM (and some headless layouts) report 0×0 even for visible nodes.
    if (el.isConnected) {
      return el;
    }
  }
  return null;
}

export function waitForVisibleFtueAnchor(
  dataFtue: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<HTMLElement | null> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const intervalMs = options.intervalMs ?? 50;
  const start = Date.now();

  return new Promise((resolve) => {
    function tick() {
      const el = queryVisibleFtueAnchor(dataFtue);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }
      window.setTimeout(tick, intervalMs);
    }
    tick();
  });
}
