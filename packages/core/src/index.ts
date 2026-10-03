export type * from "./generated/types.ts";
export { schema } from "./generated/schema.ts";
export { ArtistJsonInvalidError, validate, type Issue, type ValidationResult } from "./validate.ts";
export { normalize, parse } from "./parse.ts";
export { canonicalize } from "./canonical.ts";
export {
  ArtistJsonNotFoundError,
  fetchArtistJson,
  findLink,
  parseTxtRecord,
  type Attempt,
  type DiscoveryStep,
  type FetchOptions,
  type FetchResult,
} from "./discover.ts";
