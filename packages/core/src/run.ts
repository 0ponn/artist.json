import { readFile } from "node:fs/promises";
import { ArtistJsonNotFoundError, fetchArtistJson, fetchDocument, type FetchOptions } from "./discover.ts";
import { ArtistJsonInvalidError, validate, type Issue } from "./validate.ts";

const USAGE = `Usage:
  artistjson validate <file | https URL | domain>...   check documents against the artist.json schema
  artistjson discover <domain>                         show where a domain's artist.json is found

Exit status: 0 all valid, 1 a document is invalid, 2 not found or usage error.`;

export interface Io {
  out: (line: string) => void;
  err: (line: string) => void;
}

const trace = (io: Io, err: unknown) => {
  if (err instanceof ArtistJsonNotFoundError) for (const a of err.attempts) io.err(`  ${a.step}: ${a.target}: ${a.outcome}`);
};

const fail = (io: Io, target: string, errors: Issue[]) => {
  io.out(`FAIL ${target}`);
  for (const e of errors) io.out(`  ${e.path || "/"}: ${e.message}`);
};

/** A file path, a document URL, or a domain (bare, or an https URL with no path) to run discovery on. */
async function load(target: string, options: FetchOptions): Promise<{ source: string; document: unknown }> {
  if (!/^https?:\/\//i.test(target)) {
    try {
      return { source: target, document: JSON.parse(await readFile(target, "utf8")) };
    } catch (err) {
      const looksLikeFile = /[/\\]|\.json$/i.test(target);
      if ((err as { code?: string }).code !== "ENOENT" || looksLikeFile) throw err;
    }
  }
  const url = /^https?:\/\//i.test(target) ? new URL(target) : undefined;
  if (url && (url.pathname !== "/" || url.search)) {
    const fetched = await fetchDocument(url.href, options);
    return { source: fetched.url, document: fetched.body };
  }
  const found = await fetchArtistJson(url ? url.hostname : target, { ...options, strict: true });
  return { source: `${found.url} (via ${found.via})`, document: found.document };
}

export async function run(argv: string[], io: Io, options: FetchOptions = {}): Promise<number> {
  const [command, ...targets] = argv;

  if (command === "validate" && targets.length > 0) {
    let status = 0;
    for (const target of targets) {
      try {
        const { source, document } = await load(target, options);
        const result = validate(document);
        if (result.valid) io.out(`OK   ${source}`);
        else {
          fail(io, source, result.errors);
          status = Math.max(status, 1);
        }
      } catch (err) {
        if (err instanceof ArtistJsonInvalidError) {
          fail(io, err.url ?? target, err.errors);
          status = Math.max(status, 1);
        } else {
          io.err(`${target}: ${err instanceof Error ? err.message : String(err)}`);
          trace(io, err);
          status = 2;
        }
      }
    }
    return status;
  }

  if (command === "discover" && targets.length === 1) {
    try {
      const found = await fetchArtistJson(targets[0]!, options);
      io.out(`${found.url} (via ${found.via})`);
      return 0;
    } catch (err) {
      io.err(err instanceof Error ? err.message : String(err));
      trace(io, err);
      return err instanceof ArtistJsonInvalidError ? 1 : 2;
    }
  }

  io.err(USAGE);
  return 2;
}
