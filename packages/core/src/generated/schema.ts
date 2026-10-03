// GENERATED from spec/artist.schema.json by scripts/generate.ts. Do not edit.
export const schema: Record<string, unknown> = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://artistjson.org/schema/v1/artist.schema.json",
  "title": "artist.json",
  "description": "Open, machine-readable description of a music artist's tour dates, releases, merchandise and links. Served at https://<artist-domain>/.well-known/artist.json (alias: /artist.json).",
  "type": "object",
  "required": [
    "spec_version",
    "last_updated",
    "artist"
  ],
  "properties": {
    "$schema": {
      "type": "string",
      "format": "uri",
      "description": "Optional pointer to the schema this document conforms to. Enables editor autocompletion. Consumers MUST NOT rely on it; use spec_version."
    },
    "spec_version": {
      "type": "string",
      "pattern": "^1\\.[0-9]+\\.[0-9]+$",
      "description": "Semantic version of the artist.json specification this document follows. Major version 1 is guaranteed backward-compatible for every 1.x consumer."
    },
    "last_updated": {
      "type": "string",
      "format": "date-time",
      "description": "RFC 3339 timestamp of the last content change (not the last publish)."
    },
    "generator": {
      "type": "object",
      "description": "Software that produced this file. Informational.",
      "properties": {
        "name": {
          "type": "string"
        },
        "version": {
          "type": "string"
        },
        "url": {
          "type": "string",
          "format": "uri"
        }
      },
      "additionalProperties": false
    },
    "hub": {
      "type": "string",
      "format": "uri",
      "description": "Optional WebSub hub URL. Consumers can subscribe there to be notified when this document changes."
    },
    "artist": {
      "$ref": "#/$defs/artist"
    },
    "tour_dates": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/event"
      },
      "description": "Events ordered by start ascending. Publishers SHOULD include past events for at most 30 days."
    },
    "releases": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/release"
      },
      "description": "Releases ordered by release_date descending."
    },
    "merchandise": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/product"
      }
    },
    "links": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/link"
      },
      "description": "Free-form links for human-readable pages (link-in-bio)."
    }
  },
  "patternProperties": {
    "^x_": {
      "description": "Vendor extension. Consumers MUST ignore unknown x_ keys."
    }
  },
  "additionalProperties": true,
  "$defs": {
    "id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128,
      "pattern": "^[A-Za-z0-9_\\-:.]+$",
      "description": "Stable identifier, unique within this document and stable across publishes. Consumers key on it for change detection."
    },
    "uri": {
      "type": "string",
      "format": "uri",
      "maxLength": 2048
    },
    "country_code": {
      "type": "string",
      "pattern": "^[A-Z]{2}$",
      "description": "ISO 3166-1 alpha-2."
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "description": "ISO 4217."
    },
    "money": {
      "type": "object",
      "required": [
        "amount",
        "currency"
      ],
      "properties": {
        "amount": {
          "type": "number",
          "minimum": 0,
          "description": "Major units (e.g. 35.00 USD). Publishers SHOULD emit at most 2 decimals; consumers MUST NOT do arithmetic on this without converting to minor units."
        },
        "currency": {
          "$ref": "#/$defs/currency"
        }
      },
      "additionalProperties": false
    },
    "image": {
      "type": "object",
      "required": [
        "url"
      ],
      "properties": {
        "url": {
          "$ref": "#/$defs/uri"
        },
        "width": {
          "type": "integer",
          "minimum": 1
        },
        "height": {
          "type": "integer",
          "minimum": 1
        },
        "alt": {
          "type": "string",
          "maxLength": 500
        }
      },
      "additionalProperties": false
    },
    "artist": {
      "type": "object",
      "required": [
        "name"
      ],
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "sort_name": {
          "type": "string",
          "maxLength": 200
        },
        "slug": {
          "type": "string",
          "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
          "description": "URL-safe handle, unique within the publisher's namespace."
        },
        "type": {
          "type": "string",
          "enum": [
            "person",
            "group",
            "orchestra",
            "choir",
            "character",
            "other"
          ]
        },
        "bio": {
          "type": "string",
          "maxLength": 5000
        },
        "genres": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 64
          },
          "maxItems": 20
        },
        "origin": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string"
            },
            "region": {
              "type": "string"
            },
            "country_code": {
              "$ref": "#/$defs/country_code"
            }
          },
          "additionalProperties": false
        },
        "website": {
          "$ref": "#/$defs/uri"
        },
        "image": {
          "$ref": "#/$defs/image"
        },
        "isni": {
          "type": "string",
          "pattern": "^[0-9]{15}[0-9X]$",
          "description": "ISO 27729 International Standard Name Identifier, 16 characters, no spaces."
        },
        "ipi": {
          "type": "string",
          "pattern": "^[0-9]{9,11}$",
          "description": "Interested Parties Information number (CISAC)."
        },
        "ids": {
          "type": "object",
          "description": "Identifiers on external platforms. Keys are platform slugs; add new platforms freely.",
          "properties": {
            "spotify": {
              "type": "string",
              "pattern": "^[0-9A-Za-z]{22}$"
            },
            "apple_music": {
              "type": "string",
              "pattern": "^[0-9]+$"
            },
            "musicbrainz": {
              "type": "string",
              "format": "uuid"
            },
            "discogs": {
              "type": "string",
              "pattern": "^[0-9]+$"
            },
            "bandsintown": {
              "type": "string"
            },
            "ticketmaster_attraction": {
              "type": "string"
            },
            "songkick": {
              "type": "string"
            },
            "deezer": {
              "type": "string",
              "pattern": "^[0-9]+$"
            },
            "tidal": {
              "type": "string",
              "pattern": "^[0-9]+$"
            },
            "youtube_channel": {
              "type": "string",
              "pattern": "^UC[0-9A-Za-z_-]{22}$"
            }
          },
          "additionalProperties": {
            "type": "string"
          }
        },
        "socials": {
          "type": "object",
          "description": "Profile URLs keyed by platform slug (instagram, tiktok, youtube, x, facebook, bluesky, threads, bandcamp, soundcloud, spotify, apple_music, patreon, discord, twitch, ...).",
          "additionalProperties": {
            "$ref": "#/$defs/uri"
          }
        },
        "contact": {
          "type": "object",
          "properties": {
            "booking": {
              "type": "string",
              "format": "email"
            },
            "press": {
              "type": "string",
              "format": "email"
            },
            "management": {
              "type": "string",
              "format": "email"
            },
            "label": {
              "type": "string",
              "maxLength": 200
            }
          },
          "additionalProperties": {
            "type": "string"
          }
        }
      },
      "patternProperties": {
        "^x_": {}
      },
      "additionalProperties": false
    },
    "venue": {
      "type": "object",
      "required": [
        "name"
      ],
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "address": {
          "type": "string",
          "maxLength": 500
        },
        "city": {
          "type": "string",
          "maxLength": 120
        },
        "region": {
          "type": "string",
          "maxLength": 120,
          "description": "State / province / county."
        },
        "postal_code": {
          "type": "string",
          "maxLength": 20
        },
        "country_code": {
          "$ref": "#/$defs/country_code"
        },
        "latitude": {
          "type": "number",
          "minimum": -90,
          "maximum": 90
        },
        "longitude": {
          "type": "number",
          "minimum": -180,
          "maximum": 180
        },
        "url": {
          "$ref": "#/$defs/uri"
        },
        "capacity": {
          "type": "integer",
          "minimum": 1
        }
      },
      "patternProperties": {
        "^x_": {}
      },
      "additionalProperties": false
    },
    "event": {
      "type": "object",
      "required": [
        "event_id",
        "start",
        "venue",
        "status"
      ],
      "properties": {
        "event_id": {
          "$ref": "#/$defs/id"
        },
        "title": {
          "type": "string",
          "maxLength": 300,
          "description": "Defaults to '<artist> at <venue>' when absent."
        },
        "type": {
          "type": "string",
          "enum": [
            "concert",
            "festival",
            "dj_set",
            "livestream",
            "signing",
            "listening_party",
            "other"
          ],
          "default": "concert"
        },
        "start": {
          "type": "string",
          "format": "date-time",
          "description": "RFC 3339 WITH the venue's UTC offset (e.g. 2026-11-14T20:00:00-05:00). Never emit Z for a physical event unless the venue is in UTC."
        },
        "end": {
          "type": "string",
          "format": "date-time"
        },
        "doors": {
          "type": "string",
          "format": "date-time"
        },
        "timezone": {
          "type": "string",
          "description": "IANA zone of the venue, e.g. America/New_York. Required for correct 'local time' rendering across DST changes.",
          "pattern": "^[A-Za-z_]+(?:/[A-Za-z_+\\-0-9]+)*$"
        },
        "all_day": {
          "type": "boolean",
          "default": false
        },
        "status": {
          "type": "string",
          "enum": [
            "scheduled",
            "rescheduled",
            "postponed",
            "cancelled",
            "completed"
          ]
        },
        "venue": {
          "$ref": "#/$defs/venue"
        },
        "lineup": {
          "type": "array",
          "items": {
            "type": "object",
            "required": [
              "name"
            ],
            "properties": {
              "name": {
                "type": "string"
              },
              "role": {
                "type": "string",
                "enum": [
                  "headliner",
                  "support",
                  "dj",
                  "host",
                  "other"
                ]
              },
              "artist_json": {
                "$ref": "#/$defs/uri",
                "description": "That artist's own artist.json, if known."
              }
            },
            "additionalProperties": false
          }
        },
        "age_restriction": {
          "type": "string",
          "maxLength": 20,
          "description": "e.g. 'all_ages', '18+', '21+'."
        },
        "tickets": {
          "type": "object",
          "properties": {
            "url": {
              "$ref": "#/$defs/uri"
            },
            "is_sold_out": {
              "type": "boolean"
            },
            "on_sale_at": {
              "type": "string",
              "format": "date-time"
            },
            "price_min": {
              "$ref": "#/$defs/money"
            },
            "price_max": {
              "$ref": "#/$defs/money"
            },
            "presale_code_url": {
              "$ref": "#/$defs/uri"
            }
          },
          "additionalProperties": false
        },
        "url": {
          "$ref": "#/$defs/uri",
          "description": "Canonical event page (artist site or ticketing page)."
        },
        "image": {
          "$ref": "#/$defs/image"
        },
        "description": {
          "type": "string",
          "maxLength": 2000
        },
        "sources": {
          "type": "array",
          "description": "Where this event was aggregated from. Lets consumers de-duplicate against their own feeds.",
          "items": {
            "type": "object",
            "required": [
              "provider",
              "external_id"
            ],
            "properties": {
              "provider": {
                "type": "string",
                "maxLength": 64
              },
              "external_id": {
                "type": "string",
                "maxLength": 200
              },
              "url": {
                "$ref": "#/$defs/uri"
              }
            },
            "additionalProperties": false
          }
        },
        "updated_at": {
          "type": "string",
          "format": "date-time"
        }
      },
      "patternProperties": {
        "^x_": {}
      },
      "additionalProperties": false
    },
    "track": {
      "type": "object",
      "required": [
        "position",
        "title"
      ],
      "properties": {
        "position": {
          "type": "integer",
          "minimum": 1
        },
        "disc": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        },
        "title": {
          "type": "string",
          "maxLength": 300
        },
        "isrc": {
          "type": "string",
          "pattern": "^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$"
        },
        "duration_ms": {
          "type": "integer",
          "minimum": 0
        },
        "explicit": {
          "type": "boolean"
        },
        "preview_url": {
          "$ref": "#/$defs/uri"
        }
      },
      "additionalProperties": false
    },
    "release": {
      "type": "object",
      "required": [
        "release_id",
        "title",
        "release_date",
        "type"
      ],
      "properties": {
        "release_id": {
          "$ref": "#/$defs/id"
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300
        },
        "type": {
          "type": "string",
          "enum": [
            "album",
            "ep",
            "single",
            "compilation",
            "live",
            "remix",
            "mixtape",
            "soundtrack",
            "other"
          ]
        },
        "release_date": {
          "type": "string",
          "pattern": "^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$",
          "description": "ISO 8601 date. Year or year-month allowed for announced-but-undated releases."
        },
        "status": {
          "type": "string",
          "enum": [
            "announced",
            "presave",
            "released"
          ],
          "default": "released"
        },
        "upc": {
          "type": "string",
          "pattern": "^[0-9]{12,14}$"
        },
        "label": {
          "type": "string",
          "maxLength": 200
        },
        "catalog_number": {
          "type": "string",
          "maxLength": 64
        },
        "artwork": {
          "$ref": "#/$defs/image"
        },
        "tracks": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/track"
          }
        },
        "links": {
          "type": "object",
          "description": "Streaming / purchase URLs keyed by platform slug (spotify, apple_music, bandcamp, youtube, youtube_music, tidal, deezer, amazon_music, soundcloud, qobuz, beatport, presave, ...).",
          "additionalProperties": {
            "$ref": "#/$defs/uri"
          }
        },
        "ids": {
          "type": "object",
          "description": "Platform identifiers for this release (spotify, apple_music, musicbrainz_release_group, discogs_master, ...).",
          "additionalProperties": {
            "type": "string"
          }
        },
        "updated_at": {
          "type": "string",
          "format": "date-time"
        }
      },
      "patternProperties": {
        "^x_": {}
      },
      "additionalProperties": false
    },
    "inventory": {
      "type": "object",
      "required": [
        "in_stock"
      ],
      "properties": {
        "in_stock": {
          "type": "boolean"
        },
        "quantity_remaining": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0,
          "description": "null when the merchant does not expose counts."
        },
        "low_stock": {
          "type": "boolean",
          "description": "Publisher-defined threshold hint for UI badges."
        },
        "restock_at": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    },
    "variant": {
      "type": "object",
      "required": [
        "variant_id",
        "name"
      ],
      "properties": {
        "variant_id": {
          "$ref": "#/$defs/id"
        },
        "name": {
          "type": "string",
          "maxLength": 200,
          "description": "e.g. 'Black / L', 'Clear vinyl'."
        },
        "sku": {
          "type": "string",
          "maxLength": 64
        },
        "price": {
          "$ref": "#/$defs/money"
        },
        "inventory": {
          "$ref": "#/$defs/inventory"
        },
        "purchase_url": {
          "$ref": "#/$defs/uri"
        }
      },
      "additionalProperties": false
    },
    "product": {
      "type": "object",
      "required": [
        "product_id",
        "name",
        "type",
        "price",
        "inventory",
        "purchase_url"
      ],
      "properties": {
        "product_id": {
          "$ref": "#/$defs/id"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300
        },
        "description": {
          "type": "string",
          "maxLength": 5000
        },
        "type": {
          "type": "string",
          "enum": [
            "apparel",
            "physical_media",
            "accessory",
            "print",
            "digital",
            "bundle",
            "ticket_addon",
            "other"
          ]
        },
        "media_format": {
          "type": "string",
          "enum": [
            "vinyl",
            "cd",
            "cassette",
            "dvd",
            "bluray",
            "other"
          ],
          "description": "Only when type = physical_media."
        },
        "release_id": {
          "$ref": "#/$defs/id",
          "description": "Links a physical pressing to a release in this document."
        },
        "images": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/image"
          }
        },
        "price": {
          "$ref": "#/$defs/money",
          "description": "Lowest variant price when variants differ."
        },
        "compare_at_price": {
          "$ref": "#/$defs/money"
        },
        "inventory": {
          "$ref": "#/$defs/inventory",
          "description": "Aggregated across variants."
        },
        "variants": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/variant"
          }
        },
        "purchase_url": {
          "$ref": "#/$defs/uri"
        },
        "preorder": {
          "type": "boolean",
          "default": false
        },
        "ships_from_country_code": {
          "$ref": "#/$defs/country_code"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 64
          },
          "maxItems": 30
        },
        "sources": {
          "type": "array",
          "items": {
            "type": "object",
            "required": [
              "provider",
              "external_id"
            ],
            "properties": {
              "provider": {
                "type": "string"
              },
              "external_id": {
                "type": "string"
              },
              "url": {
                "$ref": "#/$defs/uri"
              }
            },
            "additionalProperties": false
          }
        },
        "updated_at": {
          "type": "string",
          "format": "date-time"
        }
      },
      "patternProperties": {
        "^x_": {}
      },
      "additionalProperties": false
    },
    "link": {
      "type": "object",
      "required": [
        "label",
        "url"
      ],
      "properties": {
        "label": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100
        },
        "url": {
          "$ref": "#/$defs/uri"
        },
        "kind": {
          "type": "string",
          "enum": [
            "newsletter",
            "patreon",
            "discord",
            "press",
            "epk",
            "booking",
            "video",
            "playlist",
            "podcast",
            "other"
          ]
        },
        "image": {
          "$ref": "#/$defs/image"
        },
        "expires_at": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
};
