import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import formats from "ajv-formats";
import { schema } from "./generated/schema.ts";
import type { ArtistJson } from "./generated/types.ts";

export interface Issue {
  /** JSON Pointer to the offending value; "" is the document root. */
  path: string;
  message: string;
}

export type ValidationResult = { valid: true; document: ArtistJson } | { valid: false; errors: Issue[] };

export class ArtistJsonInvalidError extends Error {
  readonly errors: Issue[];
  /** Where the document came from, when it was fetched. */
  readonly url: string | undefined;
  constructor(errors: Issue[], url?: string) {
    super(`invalid artist.json${url ? ` at ${url}` : ""}: ${errors.map((e) => `${e.path || "/"} ${e.message}`).join("; ")}`);
    this.name = "ArtistJsonInvalidError";
    this.errors = errors;
    this.url = url;
  }
}

let compiled: ValidateFunction | undefined;
function validator(): ValidateFunction {
  if (!compiled) {
    const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
    formats.default(ajv); // CommonJS module: the plugin function is both the module and its .default
    compiled = ajv.compile(schema);
  }
  return compiled;
}

function toIssue(e: ErrorObject): Issue {
  const key = e.keyword === "additionalProperties" ? ` (${e.params.additionalProperty})` : "";
  return { path: e.instancePath, message: `${e.message ?? e.keyword}${key}` };
}

/** Strict conformance check against the schema, as a publisher must pass it. Never throws. */
export function validate(document: unknown): ValidationResult {
  const check = validator();
  if (check(document)) return { valid: true, document: document as ArtistJson };
  return { valid: false, errors: (check.errors ?? []).map(toIssue) };
}
