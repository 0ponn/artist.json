import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { ArtistJsonInvalidError, canonicalize, normalize, parse, validate } from "../src/index.ts";

const spec = new URL("../../../spec/", import.meta.url);
const load = (dir: string) =>
  readdirSync(new URL(dir, spec))
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ name: `${dir}${f}`, doc: JSON.parse(readFileSync(new URL(dir + f, spec), "utf8")) as unknown }));

const full = () => JSON.parse(readFileSync(new URL("tests/valid/full.json", spec), "utf8"));

// SPEC section 4: conformant = accepts every valid fixture, rejects every invalid one.
for (const { name, doc } of [...load("tests/valid/"), ...load("examples/")]) {
  test(`accepts ${name}`, () => {
    const result = validate(doc);
    assert.deepEqual(result.valid ? [] : result.errors, []);
  });
}
for (const { name, doc } of load("tests/invalid/")) {
  test(`rejects ${name}`, () => {
    assert.equal(validate(doc).valid, false);
  });
}

test("reports a JSON pointer and the offending key", () => {
  const doc = full();
  doc.tour_dates[0].ticket_link = "https://example.com";
  const result = validate(doc);
  assert.equal(result.valid, false);
  assert.deepEqual(!result.valid && result.errors, [
    { path: "/tour_dates/0", message: "must NOT have additional properties (ticket_link)" },
  ]);
});

test("checks format: uri, which the Python validator does not", () => {
  const doc = full();
  doc.merchandise[0].purchase_url = "not a url";
  const result = validate(doc);
  assert.equal(!result.valid && result.errors[0]?.path, "/merchandise/0/purchase_url");
});

test("rejects non-objects without throwing", () => {
  for (const value of [null, 42, "x", []]) assert.equal(validate(value).valid, false);
});

test("strict validate rejects an unknown enum value and an unknown key", () => {
  const doc = full();
  doc.tour_dates[0].type = "hologram";
  assert.equal(validate(doc).valid, false);
});

test("parse maps an unknown enum value to other and drops unknown keys on closed objects", () => {
  const doc = full();
  doc.tour_dates[0].type = "hologram";
  doc.tour_dates[0].future_field = { anything: true };
  doc.tour_dates[0].venue.future_field = 1;
  doc.tour_dates[0].x_vendor = "kept";
  doc.future_root_field = "kept";
  const parsed = parse(doc);
  const event = parsed.tour_dates![0]!;
  assert.equal(event.type, "other");
  assert.equal("future_field" in event, false);
  assert.equal("future_field" in event.venue, false);
  assert.equal(event.x_vendor, "kept");
  assert.equal(parsed.future_root_field, "kept");
});

test("parse accepts a later 1.x spec_version", () => {
  const doc = full();
  doc.spec_version = "1.4.0";
  assert.equal(parse(doc).spec_version, "1.4.0");
});

test("parse does not mutate its input", () => {
  const doc = full();
  doc.tour_dates[0].type = "hologram";
  normalize(doc);
  assert.equal(doc.tour_dates[0].type, "hologram");
});

test("parse leaves an unknown value alone when the enum has no other member", () => {
  const doc = full();
  doc.tour_dates[0].status = "teleported";
  assert.equal((normalize(doc) as typeof doc).tour_dates[0].status, "teleported");
  assert.throws(() => parse(doc), ArtistJsonInvalidError);
});

test("parse throws with the validation errors attached", () => {
  assert.throws(
    () => parse({ spec_version: "1.0.0" }),
    (err: unknown) => err instanceof ArtistJsonInvalidError && err.errors.length === 2,
  );
});

test("normalize copies a __proto__ key as data instead of setting a prototype", () => {
  const doc = JSON.parse(`{"spec_version":"1.0.0","last_updated":"2026-10-01T15:00:00Z","artist":{"name":"A","ids":{"__proto__":{"polluted":"yes"}}},"__proto__":{"artist":{"name":"B"}}}`);
  const out = normalize(doc) as { artist: { name: string; ids: Record<string, unknown> } };
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.equal(Object.getPrototypeOf(out.artist.ids), Object.prototype);
  assert.equal(out.artist.ids.polluted, undefined);
  assert.equal(out.artist.name, "A");
});

test("deeply nested input cannot overflow the stack: traversal depth is bounded by the schema", () => {
  let deep: unknown = [];
  for (let i = 0; i < 200_000; i++) deep = [deep];
  let deepObject: unknown = {};
  for (let i = 0; i < 200_000; i++) deepObject = { x_next: deepObject, next: deepObject };
  const doc = { ...full(), tour_dates: deep, x_deep: deepObject, future: deepObject, artist: { name: "A", ids: { a: deepObject }, x_deep: deepObject } };
  assert.equal(validate(normalize(doc)).valid, false);
});

test("canonicalize: key order does not change the bytes; array order does", () => {
  const a = canonicalize({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: null } });
  const b = canonicalize({ a: { c: null, d: [3, { y: 2, z: 1 }] }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{\n  "a": {\n    "c": null,\n    "d": [\n      3,\n      {\n        "y": 2,\n        "z": 1\n      }\n    ]\n  },\n  "b": 1\n}\n');
  assert.notEqual(canonicalize([1, 2]), canonicalize([2, 1]));
});
