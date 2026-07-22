/** Shallow object equality — snapshot dedupe for coalesced subscriptions */
export function shallowEqual<T extends Record<string, unknown>>(
  a: T,
  b: T,
): boolean {
  if (Object.is(a, b)) return true
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false

  for (const k of aKeys) {
    if (!Object.is(a[k], b[k])) return false
  }

  return true
}
