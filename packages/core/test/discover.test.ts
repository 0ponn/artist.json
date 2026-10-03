import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTxtRecord } from "../src/discover.ts";
import { ArtistJsonInvalidError, ArtistJsonNotFoundError, fetchArtistJson } from "../src/index.ts";

const DOC = JSON.stringify({ spec_version: "1.0.0", last_updated: "2026-10-01T15:00:00Z", artist: { name: "Solo Act" } });

interface Route {
  status?: number;
  type?: string;
  body?: string;
  headers?: Record<string, string>;
}

/** A fetch that serves only the given URLs and 404s the rest; records what was requested. */
function fakeFetch(routes: Record<string, Route>) {
  const calls: string[] = [];
  const impl = async (input: string | URL | Request): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    const route = routes[url];
    if (!route) return new Response("not found", { status: 404, headers: { "content-type": "text/plain" } });
    return new Response(route.body ?? "", {
      status: route.status ?? 200,
      headers: { "content-type": route.type ?? "application/json", ...route.headers },
    });
  };
  return { fetch: impl as typeof fetch, calls };
}

const noDns = async () => [];
const html = (head: string) => ({ type: "text/html; charset=utf-8", body: `<!doctype html><html><head>${head}</head><body></body></html>` });

test("step 1: well-known wins and nothing else is requested", async () => {
  const f = fakeFetch({
    "https://band.example/.well-known/artist.json": { body: DOC, headers: { etag: '"abc"' } },
    "https://band.example/artist.json": { body: DOC },
  });
  const result = await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns });
  assert.equal(result.via, "well-known");
  assert.equal(result.url, "https://band.example/.well-known/artist.json");
  assert.equal(result.etag, '"abc"');
  assert.equal(result.document.artist.name, "Solo Act");
  assert.deepEqual(f.calls, ["https://band.example/.well-known/artist.json"]);
});

test("accepts application/artist+json", async () => {
  const f = fakeFetch({ "https://band.example/.well-known/artist.json": { body: DOC, type: "application/artist+json" } });
  assert.equal((await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns })).via, "well-known");
});

test("step 2: /artist.json when well-known is missing", async () => {
  const f = fakeFetch({ "https://band.example/artist.json": { body: DOC } });
  assert.equal((await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns })).via, "root");
});

test("step 3: an HTML 200 on the JSON paths is not a hit; the link element is, across origins", async () => {
  const page = html(`<meta charset="utf-8">
    <!-- <link rel="artist.json" href="https://wrong.example/commented-out.json"> -->
    <link rel="stylesheet" href="/site.css">
    <LINK href='https://cdn.host.example/a/band/artist.json?v=1&amp;x=2' REL="alternate Artist.JSON">`);
  const f = fakeFetch({
    "https://band.example/.well-known/artist.json": page,
    "https://band.example/artist.json": page,
    "https://band.example/": page,
    "https://cdn.host.example/a/band/artist.json?v=1&x=2": { body: DOC },
  });
  const result = await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns });
  assert.equal(result.via, "link");
  assert.equal(result.url, "https://cdn.host.example/a/band/artist.json?v=1&x=2");
});

test("step 3: a relative href resolves against the page, and a link in the body is ignored", async () => {
  const f = fakeFetch({
    "https://band.example/": {
      type: "text/html",
      body: `<html><head><link rel=artist.json href=/data/artist.json></head><body><link rel="artist.json" href="/evil.json"></body></html>`,
    },
    "https://band.example/data/artist.json": { body: DOC },
    "https://band.example/evil.json": { body: DOC },
  });
  const result = await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns });
  assert.equal(result.url, "https://band.example/data/artist.json");
});

test("step 3: a link element outside the head does not count", async () => {
  const f = fakeFetch({
    "https://band.example/": { type: "text/html", body: `<html><head></head><body><link rel="artist.json" href="/evil.json"></body></html>` },
    "https://band.example/evil.json": { body: DOC },
  });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), ArtistJsonNotFoundError);
});

test("JSON served with a non-JSON content type is not a hit", async () => {
  const f = fakeFetch({ "https://band.example/.well-known/artist.json": { body: DOC, type: "text/plain" } });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), (err: unknown) => {
    assert.ok(err instanceof ArtistJsonNotFoundError);
    assert.match(err.attempts[0]!.outcome, /content type is text\/plain/);
    return true;
  });
});

test("where redirects are opaque (browsers), follows and then checks the final URL is HTTPS", async () => {
  const opaque = { type: "opaqueredirect", status: 0, ok: false, headers: new Headers(), url: "" } as Response;
  const followed = (url: string) => {
    const res = new Response(DOC, { headers: { "content-type": "application/json" } });
    Object.defineProperty(res, "url", { value: url });
    return res;
  };
  const via = (finalUrl: string) =>
    (async (_input: string | URL | Request, init?: RequestInit) => (init?.redirect === "manual" ? opaque : followed(finalUrl))) as typeof fetch;

  // Outside a secure context nothing stops the browser following a hop through plain HTTP, so the redirect is refused.
  await assert.rejects(
    fetchArtistJson("band.example", { fetch: via("https://www.band.example/.well-known/artist.json"), resolveTxt: noDns }),
    (err: unknown) => err instanceof ArtistJsonNotFoundError && /cannot be verified/.test(err.attempts[0]!.outcome),
  );

  const scope = globalThis as { isSecureContext?: boolean };
  scope.isSecureContext = true;
  try {
    const ok = await fetchArtistJson("band.example", { fetch: via("https://www.band.example/.well-known/artist.json"), resolveTxt: noDns });
    assert.equal(ok.url, "https://www.band.example/.well-known/artist.json");
    await assert.rejects(
      fetchArtistJson("band.example", { fetch: via("http://www.band.example/.well-known/artist.json"), resolveTxt: noDns }),
      (err: unknown) => err instanceof ArtistJsonNotFoundError && /non-HTTPS/.test(err.attempts[0]!.outcome),
    );
  } finally {
    delete scope.isSecureContext;
  }
});

test("step 4: DNS TXT at _artist.<domain>", async () => {
  const f = fakeFetch({ "https://cdn.host.example/band.json": { body: DOC } });
  const asked: string[] = [];
  const result = await fetchArtistJson("Band.Example.", {
    fetch: f.fetch,
    resolveTxt: async (name) => {
      asked.push(name);
      return ["v=spf1 -all", "v=artist1; url=https://cdn.host.example/band.json"];
    },
  });
  assert.equal(result.via, "dns");
  assert.deepEqual(asked, ["_artist.band.example"]);
});

test("step 5: the registry is consulted only when configured", async () => {
  const routes = {
    "https://api.registry.example/v1/resolve?domain=band.example": { body: JSON.stringify({ url: "https://cdn.host.example/band.json" }) },
    "https://cdn.host.example/band.json": { body: DOC },
  };
  const without = fakeFetch(routes);
  await assert.rejects(fetchArtistJson("band.example", { fetch: without.fetch, resolveTxt: noDns }), ArtistJsonNotFoundError);
  assert.equal(without.calls.some((u) => u.includes("registry")), false);

  const withRegistry = fakeFetch(routes);
  const result = await fetchArtistJson("band.example", {
    fetch: withRegistry.fetch,
    resolveTxt: noDns,
    registry: "https://api.registry.example/v1/",
  });
  assert.equal(result.via, "registry");
});

test("not found lists every attempt in order", async () => {
  const f = fakeFetch({});
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), (err: unknown) => {
    assert.ok(err instanceof ArtistJsonNotFoundError);
    assert.deepEqual(
      err.attempts.map((a) => a.step),
      ["well-known", "root", "link", "dns"],
    );
    assert.match(err.attempts[0]!.outcome, /404/);
    return true;
  });
});

test("follows an HTTPS redirect and reports the final URL", async () => {
  const f = fakeFetch({
    "https://band.example/.well-known/artist.json": { status: 301, headers: { location: "https://www.band.example/.well-known/artist.json" } },
    "https://www.band.example/.well-known/artist.json": { body: DOC },
  });
  const result = await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns });
  assert.equal(result.url, "https://www.band.example/.well-known/artist.json");
});

test("refuses a redirect to plain HTTP and never requests it", async () => {
  const f = fakeFetch({
    "https://band.example/.well-known/artist.json": { status: 302, headers: { location: "http://band.example/artist.json" } },
    "http://band.example/artist.json": { body: DOC },
  });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), (err: unknown) => {
    assert.ok(err instanceof ArtistJsonNotFoundError);
    assert.match(err.attempts[0]!.outcome, /non-HTTPS/);
    return true;
  });
  assert.equal(f.calls.some((u) => u.startsWith("http://")), false);
});

test("stops after too many redirects", async () => {
  const f = fakeFetch({
    "https://band.example/.well-known/artist.json": { status: 302, headers: { location: "https://band.example/.well-known/artist.json" } },
  });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), ArtistJsonNotFoundError);
  assert.ok(f.calls.length < 20);
});

test("refuses a body over the size limit", async () => {
  const big = JSON.stringify({ ...JSON.parse(DOC), x_pad: "a".repeat(2000) });
  const f = fakeFetch({ "https://band.example/.well-known/artist.json": { body: big } });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns, maxBytes: 1000 }), (err: unknown) => {
    assert.ok(err instanceof ArtistJsonNotFoundError);
    assert.match(err.attempts[0]!.outcome, /1000 bytes/);
    return true;
  });
});

test("a found but invalid document ends discovery with the errors", async () => {
  const f = fakeFetch({
    "https://band.example/.well-known/artist.json": { body: JSON.stringify({ spec_version: "1.0.0" }) },
    "https://band.example/artist.json": { body: DOC },
  });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), (err: unknown) => {
    assert.ok(err instanceof ArtistJsonInvalidError);
    assert.equal(err.url, "https://band.example/.well-known/artist.json");
    return true;
  });
  assert.equal(f.calls.length, 1);
});

test("a JSON response that does not parse to an object ends discovery too", async () => {
  for (const body of ['{"spec_version": ', "[]", '"text"']) {
    const f = fakeFetch({
      "https://band.example/.well-known/artist.json": { body },
      "https://band.example/artist.json": { body: DOC },
    });
    await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns }), (err: unknown) => {
      assert.ok(err instanceof ArtistJsonInvalidError, body);
      assert.deepEqual(err.errors.map((e) => e.path), [""]);
      return true;
    });
    assert.equal(f.calls.length, 1);
  }
});

test("a malformed registry response is a failed step, not an invalid document", async () => {
  const f = fakeFetch({ "https://api.registry.example/v1/resolve?domain=band.example": { body: "not json" } });
  await assert.rejects(
    fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns, registry: "https://api.registry.example/v1" }),
    ArtistJsonNotFoundError,
  );
});

test("consumer leniency is the default; strict turns it off", async () => {
  const doc = JSON.stringify({ ...JSON.parse(DOC), artist: { name: "Solo Act", type: "hologram", future_key: 1 } });
  const f = fakeFetch({ "https://band.example/.well-known/artist.json": { body: doc } });
  const result = await fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns });
  assert.deepEqual(result.document.artist, { name: "Solo Act", type: "other" });
  await assert.rejects(fetchArtistJson("band.example", { fetch: f.fetch, resolveTxt: noDns, strict: true }), ArtistJsonInvalidError);
});

test("rejects input that is not a bare domain", async () => {
  const f = fakeFetch({});
  for (const bad of ["https://band.example", "band.example/path", "band.example:8443", "user@band.example", "localhost", ""]) {
    await assert.rejects(fetchArtistJson(bad, { fetch: f.fetch, resolveTxt: noDns }), TypeError, bad);
  }
  assert.deepEqual(f.calls, []);
});

test("a failing DNS resolver is recorded, not thrown", async () => {
  const f = fakeFetch({});
  await assert.rejects(
    fetchArtistJson("band.example", {
      fetch: f.fetch,
      resolveTxt: async () => {
        throw new Error("SERVFAIL");
      },
    }),
    (err: unknown) => err instanceof ArtistJsonNotFoundError && /SERVFAIL/.test(err.attempts.at(-1)!.outcome),
  );
});

test("TXT record parsing ignores fields without a value and unrelated records", () => {
  assert.equal(parseTxtRecord("v=artist1; url=https://a.example/x.json"), "https://a.example/x.json");
  assert.equal(parseTxtRecord("V=artist1;URL=https://a.example/x.json;"), "https://a.example/x.json");
  assert.equal(parseTxtRecord("v=artist1; url=https://a.example/x.json?a=b; urlx"), "https://a.example/x.json?a=b");
  assert.equal(parseTxtRecord("v=spf1 include:_spf.example.com -all"), undefined);
  assert.equal(parseTxtRecord("v=artist1"), undefined);
});
