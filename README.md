# artist.json

An open standard for an artist's tour dates, releases, merchandise and links: one JSON file at

```
https://<artist-domain>/.well-known/artist.json
```

Any app, search engine or AI agent can read it without an account, an API key or a scraper. The artist owns the file; anyone can write a generator for it or a reader of it.

- **Specification:** [`spec/SPEC.md`](spec/SPEC.md), also at [artistjson.org](https://artistjson.org)
- **Schema:** [`spec/artist.schema.json`](spec/artist.schema.json) (JSON Schema 2020-12)
- **Example:** [`spec/examples/the-midnight-echo.artist.json`](spec/examples/the-midnight-echo.artist.json)
- **Conformance fixtures:** [`spec/tests/`](spec/tests), documents every validator must accept or reject
- **Library and CLI:** [`packages/core`](packages/core), published as `@artistjson/core`: types, a validator, a lenient parser for consumers, and a discovery client that finds an artist's document from their domain

## Validate a document

```bash
npx @artistjson/core validate path/to/artist.json
npx @artistjson/core validate themidnightecho.com     # discovers and validates a live document
```

or from code:

```ts
import { validate } from "@artistjson/core";

const result = validate(document);
if (!result.valid) console.error(result.errors);
```

## Changing the standard

A change is a pull request to `spec/` with the fixtures that show it, discussed in the open. Additive changes are minor versions; anything that could break a reader is a major version, as the specification's versioning section describes.

## Develop

```bash
npm ci && npm run check    # fixtures, generated types, tests and build of @artistjson/core
```

`npm run check` needs Python 3 with `jsonschema` (`pip install jsonschema`) for the fixture check.

## Licence

The specification, schema, example and conformance fixtures in `spec/` are dedicated to the public domain under [CC0 1.0](spec/LICENSE). The code is licensed under [Apache-2.0](LICENSE).

[ArtistJSON](https://artistjson.app) hosts and keeps artist.json files up to date for artists who do not want to run their own.
