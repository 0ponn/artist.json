import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "../src/run.ts";

const fixture = (path: string) => fileURLToPath(new URL(`../../../spec/tests/${path}`, import.meta.url));
const DOC = JSON.stringify({ spec_version: "1.0.0", last_updated: "2026-10-01T15:00:00Z", artist: { name: "Solo Act" } });

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  // console.log prints every argument it is given, so a sink that is handed more than the line is a bug.
  const sink = (lines: string[]) => (...args: unknown[]) => {
    assert.equal(args.length, 1);
    lines.push(String(args[0]));
  };
  return { out, err, io: { out: sink(out), err: sink(err) } };
}

const serve = (routes: Record<string, string>) =>
  (async (input: string | URL | Request) => {
    const body = routes[String(input)];
    return body === undefined
      ? new Response("no", { status: 404 })
      : new Response(body, { headers: { "content-type": "application/json" } });
  }) as typeof fetch;

const noDns = async () => [];

test("validate: files, exit 0 when all valid", async () => {
  const c = capture();
  assert.equal(await run(["validate", fixture("valid/minimal.json"), fixture("valid/full.json")], c.io), 0);
  assert.equal(c.out.length, 2);
  assert.ok(c.out.every((l) => l.startsWith("OK   ")));
});

test("validate: exit 1 and the errors when any file is invalid, and the rest are still checked", async () => {
  const c = capture();
  assert.equal(await run(["validate", fixture("invalid/lowercase-currency.json"), fixture("valid/minimal.json")], c.io), 1);
  assert.match(c.out[0]!, /^FAIL /);
  assert.match(c.out[1]!, /\/merchandise\/0\/price\/currency: must match pattern/);
  assert.match(c.out.at(-1)!, /^OK   /);
});

test("validate: a URL with a path is fetched directly", async () => {
  const c = capture();
  const fetch = serve({ "https://cdn.example/a/band/artist.json": DOC });
  assert.equal(await run(["validate", "https://cdn.example/a/band/artist.json"], c.io, { fetch }), 0);
  assert.deepEqual(c.out, ["OK   https://cdn.example/a/band/artist.json"]);
});

test("validate: a bare domain or site URL runs discovery, strictly", async () => {
  const lenientOnly = JSON.stringify({ ...JSON.parse(DOC), artist: { name: "Solo Act", future_key: 1 } });
  for (const target of ["band.example", "https://band.example", "https://band.example/"]) {
    const ok = capture();
    const good = serve({ "https://band.example/.well-known/artist.json": DOC });
    assert.equal(await run(["validate", target], ok.io, { fetch: good, resolveTxt: noDns }), 0, target);
    assert.deepEqual(ok.out, ["OK   https://band.example/.well-known/artist.json (via well-known)"]);

    const bad = capture();
    const strictFail = serve({ "https://band.example/.well-known/artist.json": lenientOnly });
    assert.equal(await run(["validate", target], bad.io, { fetch: strictFail, resolveTxt: noDns }), 1, target);
    assert.match(bad.out[0]!, /^FAIL https:\/\/band\.example\/\.well-known\/artist\.json/);
  }
});

test("validate: exit 2 with the attempts when nothing is found", async () => {
  const c = capture();
  assert.equal(await run(["validate", "band.example"], c.io, { fetch: serve({}), resolveTxt: noDns }), 2);
  assert.equal(c.out.length, 0);
  assert.ok(c.err.some((l) => l.includes("well-known") && l.includes("404")));
});

test("validate: a file that is not JSON is exit 2, not a crash", async () => {
  const c = capture();
  assert.equal(await run(["validate", fileURLToPath(import.meta.url)], c.io), 2);
});

test("validate: a missing file is reported as a missing file, not looked up as a domain", async () => {
  for (const target of ["artst.json", "./nope/artist.json"]) {
    const c = capture();
    const fetch = (async () => assert.fail("should not touch the network")) as unknown as typeof globalThis.fetch;
    assert.equal(await run(["validate", target], c.io, { fetch, resolveTxt: noDns }), 2);
    assert.match(c.err[0]!, /ENOENT|no such file/);
  }
});

test("discover: prints the URL and the step", async () => {
  const c = capture();
  const fetch = serve({ "https://band.example/artist.json": DOC });
  assert.equal(await run(["discover", "band.example"], c.io, { fetch, resolveTxt: noDns }), 0);
  assert.deepEqual(c.out, ["https://band.example/artist.json (via root)"]);
});

test("usage error is exit 2", async () => {
  for (const argv of [[], ["validate"], ["discover"], ["discover", "a.example", "b.example"], ["frobnicate", "x"]]) {
    const c = capture();
    assert.equal(await run(argv, c.io), 2);
    assert.match(c.err[0]!, /^Usage:/);
  }
});
