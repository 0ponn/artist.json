# IANA registration request: `/.well-known/artist.json`

Status: draft, not submitted. Submit once `spec/SPEC.md` is reachable at a stable public URL, which the registry requires.

Procedure (RFC 8615, section 3.1): open an issue at <https://github.com/protocol-registries/well-known-uris> or write to `wellknown-uri-review@ietf.org` with the template below. Registration is by Specification Required; a designated expert reviews it. Ask for provisional status first: it needs only the suffix and a change controller, and can be made permanent once the specification has independent implementations.

## Template

**URI suffix:** `artist.json`

**Change controller:** TO BE FILLED: the person or organisation that owns the specification, with a contact address at `artistjson.org`.

**Specification document(s):** `https://artistjson.org/spec/1.0.0/` (publishes `spec/SPEC.md`; section 2 defines the well-known location).

**Status:** provisional

**Related information:** The resource is a JSON document (`application/json`) describing a music artist's events, releases, merchandise and links. JSON Schema: `https://artistjson.org/schema/v1/artist.schema.json`. The specification also defines fallback discovery through `/artist.json`, an HTML `<link rel="artist.json">` element and a DNS TXT record at `_artist.<domain>`; only the well-known location is registered here.

## Before submitting

- [ ] `artistjson.org` is registered and serves the specification and schema at the URLs above.
- [ ] The repository, or at least `spec/`, is public.
- [ ] Change controller name and contact are filled in.
- [ ] Decide whether to also register the `application/artist+json` media type (SPEC section 2 allows it "once registered"). That is a separate request under RFC 6838.
- [ ] Decide what to do about the `artist.json` link relation. The name is syntactically valid for a registered relation type, but it is not registered, and RFC 8288 (section 2.1.2) says an unregistered relation should be a URI. Options: register it in the IANA Link Relations registry (also Specification Required), or change the specification to a URI relation before 1.0 is announced.
