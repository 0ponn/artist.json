# @artistjson/core

Types, validator and discovery client for [`artist.json`](https://artistjson.org), the open standard for an artist's tour dates, releases, merchandise and links, served at `https://<artist-domain>/.well-known/artist.json`.

```bash
npm install @artistjson/core
```

## Fetch an artist's document

```ts
import { fetchArtistJson } from "@artistjson/core";

const { document, url, via } = await fetchArtistJson("themidnightecho.com");
for (const show of document.tour_dates ?? []) console.log(show.start, show.venue.name);
```

`fetchArtistJson(domain, options?)` follows the discovery order in the specification and stops at the first step that yields a document:

1. `https://<domain>/.well-known/artist.json`
2. `https://<domain>/artist.json`
3. `<link rel="artist.json" href="...">` in the head of `https://<domain>/`
4. DNS TXT at `_artist.<domain>`: `v=artist1; url=https://...`
5. a registry, only when you pass `registry`

It throws `ArtistJsonNotFoundError` (with every `attempts` entry) when no step finds one, and `ArtistJsonInvalidError` (with `errors`) when the document found is invalid. Only HTTPS is requested, redirects to plain HTTP are refused, and bodies over 5 MB are rejected.

| Option | Default | |
|---|---|---|
| `fetch` | global `fetch` | Supply your own to add caching, rate limits or address filtering. |
| `resolveTxt` | `node:dns` | `(name) => Promise<string[]>`. Outside Node the DNS step is skipped unless you provide this. |
| `registry` | none | Base URL such as `https://api.artistjson.org/v1`. |
| `maxBytes` | `5242880` | |
| `timeoutMs` | `10000` | Per request. |
| `strict` | `false` | Validate the document exactly as published. |

If you run this on a server with domains supplied by users, pass a `fetch` that refuses private and link-local addresses. The library fetches URLs named by the domain's own HTML and DNS.

## Validate and parse

```ts
import { parse, validate } from "@artistjson/core";

const result = validate(json);          // strict: what a publisher must pass
if (!result.valid) console.error(result.errors);   // [{ path: "/tour_dates/0", message: "..." }]

const doc = parse(json);                // consumer rules, then validate; throws ArtistJsonInvalidError
```

`parse` applies the consumer rules of the specification before validating: unknown keys are dropped (`x_` vendor extensions are kept) and unknown enum values become `"other"`. That is what lets a 1.0 consumer read a 1.4 document. `validate` applies neither, so it reports exactly what a publisher got wrong.

The JSON Schema itself is exported as `schema`, and every type (`ArtistJson`, `Event`, `Release`, `Product`, ...) is generated from it.

## Command line

```bash
npx @artistjson/core validate ./artist.json
npx @artistjson/core validate themidnightecho.com
npx @artistjson/core validate https://cdn.example.com/a/band/artist.json
npx @artistjson/core discover themidnightecho.com
```

Exit status is 0 when everything is valid, 1 when a document is invalid, 2 when nothing was found or the arguments were wrong.

## Licence

Apache-2.0. The specification and schema are CC0.
