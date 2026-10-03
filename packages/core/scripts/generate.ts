// Regenerates src/generated/ from the canonical schema in spec/. Run: npm run generate -w @artistjson/core
import { readFile, writeFile } from "node:fs/promises";
import { compile } from "json-schema-to-typescript";

const banner = "// GENERATED from spec/artist.schema.json by scripts/generate.ts. Do not edit.";
const source = new URL("../../../spec/artist.schema.json", import.meta.url);
const out = (name: string) => new URL(`../src/generated/${name}`, import.meta.url);

const schema = JSON.parse(await readFile(source, "utf8"));

await writeFile(
  out("schema.ts"),
  `${banner}\nexport const schema: Record<string, unknown> = ${JSON.stringify(schema, null, 2)};\n`,
);

const types = await compile(structuredClone(schema), "ArtistJson", {
  bannerComment: banner,
  unreachableDefinitions: true,
  strictIndexSignatures: true,
  format: true,
});
await writeFile(out("types.ts"), types);
