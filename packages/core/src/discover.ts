import type { ArtistJson } from "./generated/types.ts";
import { normalize } from "./parse.ts";
import { ArtistJsonInvalidError, validate } from "./validate.ts";

/** The discovery steps of SPEC section 2, in the order they are tried. */
export type DiscoveryStep = "well-known" | "root" | "link" | "dns" | "registry";

export interface Attempt {
  step: DiscoveryStep;
  /** The URL requested, or the DNS name queried. */
  target: string;
  outcome: string;
}

export interface FetchOptions {
  /** Defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Returns the TXT records at a name, each joined into one string. Defaults to node:dns; the step is skipped where that is unavailable. */
  resolveTxt?: (name: string) => Promise<string[]>;
  /** Registry base URL, e.g. "https://api.artistjson.org/v1". The registry step runs only when this is set. */
  registry?: string;
  /** Largest body accepted. Default 5 MB (SPEC section 2). */
  maxBytes?: number;
  /** Per-request timeout. Default 10 s. */
  timeoutMs?: number;
  /** Validate the document as published instead of applying the consumer leniency rules first. */
  strict?: boolean;
}

export interface FetchResult {
  document: ArtistJson;
  /** Final URL of the document, after redirects. */
  url: string;
  via: DiscoveryStep;
  etag: string | null;
  attempts: Attempt[];
}

export class ArtistJsonNotFoundError extends Error {
  readonly domain: string;
  readonly attempts: Attempt[];
  constructor(domain: string, attempts: Attempt[]) {
    super(`no artist.json found for ${domain}`);
    this.name = "ArtistJsonNotFoundError";
    this.domain = domain;
    this.attempts = attempts;
  }
}

const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 1024 * 1024;
const JSON_TYPES = ["application/json", "application/artist+json"];

interface Settings {
  fetch: typeof fetch;
  maxBytes: number;
  timeoutMs: number;
}

interface Fetched {
  url: string;
  type: string;
  etag: string | null;
  text: string;
}

function requireHttps(url: string): void {
  if (new URL(url).protocol !== "https:") throw new Error(`refused non-HTTPS URL ${url}`);
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const over = () => new Error(`body exceeds ${maxBytes} bytes`);
  if (Number(res.headers.get("content-length")) > maxBytes) throw over();
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw over();
    }
    text += decoder.decode(value, { stream: true });
  }
}

/** GET over HTTPS only. Redirects are followed by hand so that a hop to plain HTTP is refused before it is requested (SPEC section 6). */
async function get(url: string, accept: string, maxBytes: number, settings: Settings): Promise<Fetched> {
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    requireHttps(url);
    const init = { headers: { accept }, signal: AbortSignal.timeout(settings.timeoutMs) };
    let res = await settings.fetch(url, { ...init, redirect: "manual" });
    if (res.type === "opaqueredirect") {
      // Browsers hide the Location header, so the hops cannot be inspected. In a secure context the browser itself
      // blocks any hop through plain HTTP; anywhere else the redirect has to be refused.
      if ((globalThis as { isSecureContext?: boolean }).isSecureContext !== true) {
        throw new Error("redirect cannot be verified as HTTPS-only in this runtime");
      }
      res = await settings.fetch(url, { ...init, redirect: "follow" });
      requireHttps(res.url);
      url = res.url;
    }
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url).href;
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return {
      url,
      type: (res.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase(),
      etag: res.headers.get("etag"),
      text: await readCapped(res, maxBytes),
    };
  }
  throw new Error(`more than ${MAX_REDIRECTS} redirects`);
}

/**
 * A 2xx response with a JSON content type is the document, whatever its body: if the body does not parse to an
 * object this throws ArtistJsonInvalidError rather than a plain Error, so discovery stops instead of moving on.
 */
async function getJson(url: string, settings: Settings): Promise<{ url: string; etag: string | null; body: object }> {
  const res = await get(url, JSON_TYPES.join(", "), settings.maxBytes, settings);
  if (!JSON_TYPES.includes(res.type)) throw new Error(`content type is ${res.type || "missing"}, not JSON`);
  const malformed = (message: string) => new ArtistJsonInvalidError([{ path: "", message }], res.url);
  let body: unknown;
  try {
    body = JSON.parse(res.text);
  } catch {
    throw malformed("body is not valid JSON");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) throw malformed("must be a JSON object");
  return { url: res.url, etag: res.etag, body };
}

/** Finds `<link rel="artist.json" href>` in the head of an HTML page. Returns the raw href. */
export function findLink(html: string): string | undefined {
  const visible = html.replace(/<!--[\s\S]*?-->/g, "");
  const headEnd = visible.search(/<\/head\s*>|<body[\s>]/i);
  const head = headEnd === -1 ? visible : visible.slice(0, headEnd);
  for (const [tag] of head.matchAll(/<link\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([^\s=/<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[m[1]!.toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
    }
    const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    if (rel.includes("artist.json") && attrs.href) return attrs.href.replace(/&amp;/gi, "&");
  }
  return undefined;
}

/** Extracts the URL from a `v=artist1; url=https://...` TXT record. */
export function parseTxtRecord(record: string): string | undefined {
  const fields = new Map<string, string>();
  for (const part of record.split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0) fields.set(part.slice(0, eq).trim().toLowerCase(), part.slice(eq + 1).trim());
  }
  return fields.get("v") === "artist1" ? fields.get("url") : undefined;
}

async function nodeResolveTxt(name: string): Promise<string[] | undefined> {
  // A non-literal specifier keeps browser bundlers from trying to resolve a Node built-in.
  const specifier = "node:dns/promises";
  let dns: typeof import("node:dns/promises");
  try {
    dns = await import(specifier);
  } catch {
    return undefined;
  }
  try {
    return (await dns.resolveTxt(name)).map((chunks) => chunks.join(""));
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return [];
    throw err;
  }
}

function normalizeDomain(input: string): string {
  const candidate = input.trim().toLowerCase().replace(/\.$/, "");
  let host = "";
  if (/^[^\s/:@?#\\]+\.[^\s/:@?#\\]+$/.test(candidate)) {
    try {
      host = new URL(`https://${candidate}`).hostname;
    } catch {
      // falls through to the TypeError below
    }
  }
  if (!host) throw new TypeError(`expected a bare domain such as "example.com", got ${JSON.stringify(input)}`);
  return host;
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

const settingsFrom = (options: FetchOptions): Settings => ({
  fetch: options.fetch ?? globalThis.fetch,
  maxBytes: options.maxBytes ?? 5 * 1024 * 1024,
  timeoutMs: options.timeoutMs ?? 10_000,
});

/** Fetches one document by URL under the same HTTPS, size and content-type rules as discovery. Does not validate. */
export function fetchDocument(url: string, options: FetchOptions = {}): Promise<{ url: string; etag: string | null; body: object }> {
  return getJson(url, settingsFrom(options));
}

/**
 * Resolves a domain to its artist.json using the discovery order of SPEC section 2 and returns the parsed document.
 * Throws ArtistJsonNotFoundError when no step yields a document and ArtistJsonInvalidError when the first one found is
 * malformed or invalid; a later step is never used to paper over a broken earlier one.
 *
 * This fetches URLs taken from the domain's own HTML and DNS. A server that calls it with untrusted domains
 * must supply a `fetch` that refuses private and link-local addresses.
 */
export async function fetchArtistJson(domain: string, options: FetchOptions = {}): Promise<FetchResult> {
  const host = normalizeDomain(domain);
  const settings = settingsFrom(options);
  const attempts: Attempt[] = [];

  const tryDocument = async (step: DiscoveryStep, url: string) => {
    try {
      const found = await getJson(url, settings);
      attempts.push({ step, target: url, outcome: "found" });
      return { ...found, via: step };
    } catch (err) {
      if (err instanceof ArtistJsonInvalidError) throw err;
      attempts.push({ step, target: url, outcome: message(err) });
      return undefined;
    }
  };

  /** Runs a step that first has to look up where the document is. */
  const tryIndirect = async (step: DiscoveryStep, target: string, locate: () => Promise<string | undefined>) => {
    let url: string | undefined;
    try {
      url = await locate();
    } catch (err) {
      attempts.push({ step, target, outcome: message(err) });
      return undefined;
    }
    return url ? tryDocument(step, url) : undefined;
  };

  const home = `https://${host}/`;
  const txtName = `_artist.${host}`;
  const registry = options.registry && `${options.registry.replace(/\/+$/, "")}/resolve?domain=${encodeURIComponent(host)}`;

  const found =
    (await tryDocument("well-known", `https://${host}/.well-known/artist.json`)) ??
    (await tryDocument("root", `https://${host}/artist.json`)) ??
    (await tryIndirect("link", home, async () => {
      const page = await get(home, "text/html", MAX_HTML_BYTES, settings);
      const href = findLink(page.text);
      if (!href) throw new Error('no <link rel="artist.json"> in the page head');
      return new URL(href, page.url).href;
    })) ??
    (await tryIndirect("dns", txtName, async () => {
      const records = await (options.resolveTxt ?? nodeResolveTxt)(txtName);
      if (!records) throw new Error("no DNS resolver in this runtime");
      const url = records.map(parseTxtRecord).find(Boolean);
      if (!url) throw new Error("no v=artist1 TXT record");
      return url;
    })) ??
    (registry
      ? await tryIndirect("registry", registry, async () => {
          const { body } = await getJson(registry, settings);
          const url = (body as { url?: unknown }).url;
          if (typeof url !== "string") throw new Error("registry response has no url");
          return url;
        })
      : undefined);

  if (!found) throw new ArtistJsonNotFoundError(host, attempts);

  const result = validate(options.strict ? found.body : normalize(found.body));
  if (!result.valid) throw new ArtistJsonInvalidError(result.errors, found.url);
  return { document: result.document, url: found.url, via: found.via, etag: found.etag, attempts };
}
