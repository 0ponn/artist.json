# artist.json Specification, version 1.0.0

Status: Draft for public comment. License: CC0 1.0 (spec and schema). Schema: [`artist.schema.json`](./artist.schema.json).

The key words MUST, MUST NOT, SHOULD and MAY are to be interpreted as described in RFC 2119.

## 1. Purpose

`artist.json` is a single JSON document, published by or on behalf of a music artist, that describes the artist's upcoming events, releases, merchandise and links in a machine-readable form. It replaces per-site scraping with one predictable file, the way `robots.txt` and `sitemap.xml` did for crawlers and `openapi.json` did for APIs.

## 2. Location and discovery

A consumer resolving an artist's domain `D` MUST try, in order, and stop at the first success:

1. `https://D/.well-known/artist.json` (RFC 8615 well-known URI; canonical location)
2. `https://D/artist.json`
3. An HTML `<link rel="artist.json" href="...">` element in the `<head>` of `https://D/` (the `href` MAY point to another origin; this is how hosted generators serve artists on Squarespace, Wix, Webflow and similar)
4. A DNS TXT record at `_artist.D` of the form `v=artist1; url=https://...`
5. A registry lookup, if the consumer uses one (e.g. `https://api.artistjson.org/v1/resolve?domain=D`)

A publisher MUST serve the document with:

- `Content-Type: application/json` (`application/artist+json` MAY be used once registered; consumers MUST accept both)
- `Access-Control-Allow-Origin: *` so that browser-based consumers can fetch it
- A strong `ETag` and support for `If-None-Match`, and SHOULD support `HEAD`
- `Cache-Control` with a `max-age` of at least 60 seconds; publishers SHOULD add `stale-while-revalidate`

Publishers SHOULD serve `Link: <hub-url>; rel="hub"` and set the `hub` property when they support WebSub push notifications (W3C WebSub). Publishers SHOULD gzip or brotli-compress responses. Documents SHOULD be under 1 MB; consumers MAY refuse documents over 5 MB.

## 3. Document rules

- The document MUST be a JSON object validating against `artist.schema.json` for its declared `spec_version`.
- `spec_version` MUST be present and MUST be a semantic version whose major version is `1` for this specification.
- `last_updated` MUST be the RFC 3339 time of the last content change, not of the last time the file was written. Republishing unchanged content MUST NOT bump it.
- Every `event_id`, `release_id`, `product_id` and `variant_id` MUST be stable across publishes for as long as the underlying thing exists. Consumers key change detection on them. Publishers MUST NOT reuse an identifier for a different thing.
- Timestamps for physical events (`start`, `end`, `doors`) MUST carry the venue's UTC offset and the event SHOULD carry `timezone` (IANA name). A `Z` suffix on a physical event is a specification violation unless the venue is actually in UTC.
- `tour_dates` MUST be sorted by `start` ascending. `releases` MUST be sorted by `release_date` descending. Publishers SHOULD retain past events for up to 30 days with `status: "completed"` so consumers can observe the transition, and MUST NOT retain them beyond 90 days.
- Cancelled events MUST be published with `status: "cancelled"` for at least 7 days rather than silently removed.
- Prices are major currency units (`35.00`), ISO 4217 codes are uppercase, country codes are ISO 3166-1 alpha-2 uppercase.
- Keys beginning with `x_` are vendor extensions. They MAY appear in any object that permits them. Consumers MUST ignore unknown `x_` keys.
- All other unknown keys are reserved for future minor versions. Consumers MUST ignore unknown keys. Publishers MUST NOT emit keys that are not defined by their declared `spec_version` or prefixed `x_`.
- Consumers MUST treat an unknown value of an enumerated field (for example a new `event.type`) as `"other"` rather than rejecting the document.

## 4. Versioning

The specification uses semantic versioning. Within major version 1:

| Change | Allowed in | Rule |
|---|---|---|
| Add an optional property | MINOR | Consumers on an older 1.x ignore it |
| Add an enum value | MINOR | Consumers MUST map unknown enum values to `other` |
| Relax a constraint (longer maxLength, wider range) | MINOR | |
| Add a required property, remove or rename a property, change a type, tighten a constraint | MAJOR only | Becomes `spec_version: 2.x` at a new schema URL |
| Clarify wording, fix a schema bug that rejects valid documents | PATCH | |

Schema URLs:

- `https://artistjson.org/schema/v1/artist.schema.json` always resolves to the newest 1.x schema. Consumers SHOULD validate against this.
- `https://artistjson.org/schema/1.0.0/artist.schema.json` is frozen forever. Publishers MAY reference an exact version in `$schema`.

A property marked `deprecated: true` in the schema remains valid for the rest of the major version and for at least 12 months. A new major version is announced at least 6 months before any 1.x schema URL stops being served, and 1.x URLs are never removed within 24 months of the 2.0 release.

Every release ships with a conformance suite (`spec/tests/valid/*.json`, `spec/tests/invalid/*.json`). A parser is conformant if it accepts every valid fixture and rejects every invalid one.

## 5. Mapping to Schema.org

Publishers that render HTML SHOULD also emit JSON-LD so existing crawlers benefit. The mapping is lossless in this direction:

| artist.json | Schema.org |
|---|---|
| `artist` | `MusicGroup` (or `Person` when `type` is `person`), `sameAs` from `socials` |
| `tour_dates[]` | `MusicEvent` with `startDate`, `location: Place` (`GeoCoordinates` from lat/lng), `eventStatus`, `offers: Offer` (`url`, `availability: SoldOut/InStock`, `price`, `priceCurrency`), `performer` from `lineup` |
| `releases[]` | `MusicAlbum` with `datePublished`, `albumReleaseType`, `track: MusicRecording` (`isrcCode`), `gtin13` from `upc` |
| `merchandise[]` | `Product` with `offers: Offer` (`price`, `priceCurrency`, `availability`, `url`, `inventoryLevel`) |

## 6. Security and privacy

The document is public by design. Publishers MUST NOT include personal data beyond business contact addresses. Consumers MUST NOT follow redirects to non-HTTPS origins, MUST enforce a size limit, and SHOULD rate-limit fetches to one request per origin per minute unless `Cache-Control` permits otherwise or a WebSub subscription is active.
