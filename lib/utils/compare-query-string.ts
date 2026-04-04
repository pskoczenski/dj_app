/** Order-independent compare so we skip redundant router.replace (avoids navigation loops). */
export function areQueryStringsEqual(a: string, b: string): boolean {
  const entries = (qs: string) =>
    [...new URLSearchParams(qs).entries()].sort(([k1, v1], [k2, v2]) =>
      k1 === k2 ? v1.localeCompare(v2) : k1.localeCompare(k2),
    );
  const ea = entries(a);
  const eb = entries(b);
  if (ea.length !== eb.length) return false;
  return ea.every(([k, v], i) => k === eb[i][0] && v === eb[i][1]);
}
