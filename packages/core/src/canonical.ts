/**
 * The canonical serialisation of an artist.json document: keys sorted at every level, two-space indent, trailing
 * newline. A publisher that hashes these bytes for its ETag gets the same ETag for the same content however the
 * document was assembled or stored in between.
 */
export function canonicalize(value: unknown): string {
  const sortKeys = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sortKeys)
      : v !== null && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]),
          )
        : v;
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}
