import { schema } from "./generated/schema.ts";
import type { ArtistJson } from "./generated/types.ts";
import { ArtistJsonInvalidError, validate } from "./validate.ts";

type Schema = Record<string, unknown>;

const defs = schema.$defs as Record<string, Schema>;

function deref(s: Schema): Schema {
  while (typeof s.$ref === "string") s = defs[s.$ref.slice("#/$defs/".length)] ?? {};
  return s;
}

function walk(value: unknown, s: Schema): unknown {
  s = deref(s);
  if (Array.isArray(value)) {
    const items = s.items as Schema | undefined;
    return items ? value.map((v) => walk(v, items)) : value;
  }
  if (value !== null && typeof value === "object") {
    const properties = (s.properties ?? {}) as Record<string, Schema>;
    const patterns = Object.keys((s.patternProperties ?? {}) as object).map((p) => new RegExp(p));
    const additional = s.additionalProperties;
    const kept: [string, unknown][] = [];
    for (const [key, v] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) kept.push([key, walk(v, properties[key]!)]);
      else if (patterns.some((p) => p.test(key))) kept.push([key, v]);
      else if (additional === false) continue; // reserved for a later minor version; SPEC section 3 says ignore
      else kept.push([key, additional !== null && typeof additional === "object" ? walk(v, additional as Schema) : v]);
    }
    return Object.fromEntries(kept); // defines own properties, so a "__proto__" key stays data
  }
  if (typeof value === "string" && Array.isArray(s.enum) && !s.enum.includes(value) && s.enum.includes("other")) return "other";
  return value;
}

/**
 * Applies the consumer rules of SPEC section 3 and returns a copy: unknown keys on closed objects are dropped
 * (`x_` extensions are kept) and unknown enum values become "other" where the enum has that member.
 */
export function normalize(document: unknown): unknown {
  return walk(document, schema);
}

/** The consumer entry point: normalize, then validate. Throws ArtistJsonInvalidError. */
export function parse(document: unknown): ArtistJson {
  const result = validate(normalize(document));
  if (!result.valid) throw new ArtistJsonInvalidError(result.errors);
  return result.document;
}
