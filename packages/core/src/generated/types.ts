// GENERATED from spec/artist.schema.json by scripts/generate.ts. Do not edit.

/**
 * ISO 3166-1 alpha-2.
 *
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "country_code".
 */
export type CountryCode = string;
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "uri".
 */
export type Uri = string;
/**
 * Stable identifier, unique within this document and stable across publishes. Consumers key on it for change detection.
 *
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "id".
 */
export type Id = string;
/**
 * ISO 4217.
 *
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "currency".
 */
export type Currency = string;

/**
 * Open, machine-readable description of a music artist's tour dates, releases, merchandise and links. Served at https://<artist-domain>/.well-known/artist.json (alias: /artist.json).
 */
export interface ArtistJson {
  /**
   * Optional pointer to the schema this document conforms to. Enables editor autocompletion. Consumers MUST NOT rely on it; use spec_version.
   */
  $schema?: string;
  /**
   * Semantic version of the artist.json specification this document follows. Major version 1 is guaranteed backward-compatible for every 1.x consumer.
   */
  spec_version: string;
  /**
   * RFC 3339 timestamp of the last content change (not the last publish).
   */
  last_updated: string;
  /**
   * Software that produced this file. Informational.
   */
  generator?: {
    name?: string;
    version?: string;
    url?: string;
  };
  /**
   * Optional WebSub hub URL. Consumers can subscribe there to be notified when this document changes.
   */
  hub?: string;
  artist: Artist;
  /**
   * Events ordered by start ascending. Publishers SHOULD include past events for at most 30 days.
   */
  tour_dates?: Event[];
  /**
   * Releases ordered by release_date descending.
   */
  releases?: Release[];
  merchandise?: Product[];
  /**
   * Free-form links for human-readable pages (link-in-bio).
   */
  links?: Link[];
  [k: string]: unknown | undefined;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "artist".
 */
export interface Artist {
  name: string;
  sort_name?: string;
  /**
   * URL-safe handle, unique within the publisher's namespace.
   */
  slug?: string;
  type?: "person" | "group" | "orchestra" | "choir" | "character" | "other";
  bio?: string;
  /**
   * @maxItems 20
   */
  genres?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string
      ];
  origin?: {
    city?: string;
    region?: string;
    country_code?: CountryCode;
  };
  website?: Uri;
  image?: Image;
  /**
   * ISO 27729 International Standard Name Identifier, 16 characters, no spaces.
   */
  isni?: string;
  /**
   * Interested Parties Information number (CISAC).
   */
  ipi?: string;
  /**
   * Identifiers on external platforms. Keys are platform slugs; add new platforms freely.
   */
  ids?: {
    spotify?: string;
    apple_music?: string;
    musicbrainz?: string;
    discogs?: string;
    bandsintown?: string;
    ticketmaster_attraction?: string;
    songkick?: string;
    deezer?: string;
    tidal?: string;
    youtube_channel?: string;
    [k: string]: string | undefined;
  };
  /**
   * Profile URLs keyed by platform slug (instagram, tiktok, youtube, x, facebook, bluesky, threads, bandcamp, soundcloud, spotify, apple_music, patreon, discord, twitch, ...).
   */
  socials?: {
    [k: string]: Uri;
  };
  contact?: {
    booking?: string;
    press?: string;
    management?: string;
    label?: string;
    [k: string]: string | undefined;
  };
  /**
   * This interface was referenced by `Artist`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
  [k: string]: unknown;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "image".
 */
export interface Image {
  url: Uri;
  width?: number;
  height?: number;
  alt?: string;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "event".
 */
export interface Event {
  event_id: Id;
  /**
   * Defaults to '<artist> at <venue>' when absent.
   */
  title?: string;
  type?: "concert" | "festival" | "dj_set" | "livestream" | "signing" | "listening_party" | "other";
  /**
   * RFC 3339 WITH the venue's UTC offset (e.g. 2026-11-14T20:00:00-05:00). Never emit Z for a physical event unless the venue is in UTC.
   */
  start: string;
  end?: string;
  doors?: string;
  /**
   * IANA zone of the venue, e.g. America/New_York. Required for correct 'local time' rendering across DST changes.
   */
  timezone?: string;
  all_day?: boolean;
  status: "scheduled" | "rescheduled" | "postponed" | "cancelled" | "completed";
  venue: Venue;
  lineup?: {
    name: string;
    role?: "headliner" | "support" | "dj" | "host" | "other";
    /**
     * That artist's own artist.json, if known.
     */
    artist_json?: string;
  }[];
  /**
   * e.g. 'all_ages', '18+', '21+'.
   */
  age_restriction?: string;
  tickets?: {
    url?: Uri;
    is_sold_out?: boolean;
    on_sale_at?: string;
    price_min?: Money;
    price_max?: Money;
    presale_code_url?: Uri;
  };
  /**
   * Canonical event page (artist site or ticketing page).
   */
  url?: string;
  image?: Image;
  description?: string;
  /**
   * Where this event was aggregated from. Lets consumers de-duplicate against their own feeds.
   */
  sources?: {
    provider: string;
    external_id: string;
    url?: Uri;
  }[];
  updated_at?: string;
  /**
   * This interface was referenced by `Event`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
  [k: string]: unknown;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "venue".
 */
export interface Venue {
  name: string;
  address?: string;
  city?: string;
  /**
   * State / province / county.
   */
  region?: string;
  postal_code?: string;
  country_code?: CountryCode;
  latitude?: number;
  longitude?: number;
  url?: Uri;
  capacity?: number;
  /**
   * This interface was referenced by `Venue`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
  [k: string]: unknown;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "money".
 */
export interface Money {
  /**
   * Major units (e.g. 35.00 USD). Publishers SHOULD emit at most 2 decimals; consumers MUST NOT do arithmetic on this without converting to minor units.
   */
  amount: number;
  currency: Currency;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "release".
 */
export interface Release {
  release_id: Id;
  title: string;
  type: "album" | "ep" | "single" | "compilation" | "live" | "remix" | "mixtape" | "soundtrack" | "other";
  /**
   * ISO 8601 date. Year or year-month allowed for announced-but-undated releases.
   */
  release_date: string;
  status?: "announced" | "presave" | "released";
  upc?: string;
  label?: string;
  catalog_number?: string;
  artwork?: Image;
  tracks?: Track[];
  /**
   * Streaming / purchase URLs keyed by platform slug (spotify, apple_music, bandcamp, youtube, youtube_music, tidal, deezer, amazon_music, soundcloud, qobuz, beatport, presave, ...).
   */
  links?: {
    [k: string]: Uri;
  };
  /**
   * Platform identifiers for this release (spotify, apple_music, musicbrainz_release_group, discogs_master, ...).
   */
  ids?: {
    [k: string]: string | undefined;
  };
  updated_at?: string;
  /**
   * This interface was referenced by `Release`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
  [k: string]: unknown;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "track".
 */
export interface Track {
  position: number;
  disc?: number;
  title: string;
  isrc?: string;
  duration_ms?: number;
  explicit?: boolean;
  preview_url?: Uri;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "product".
 */
export interface Product {
  product_id: Id;
  name: string;
  description?: string;
  type: "apparel" | "physical_media" | "accessory" | "print" | "digital" | "bundle" | "ticket_addon" | "other";
  /**
   * Only when type = physical_media.
   */
  media_format?: "vinyl" | "cd" | "cassette" | "dvd" | "bluray" | "other";
  /**
   * Stable identifier, unique within this document and stable across publishes. Consumers key on it for change detection.
   */
  release_id?: string;
  images?: Image[];
  price: Money1;
  compare_at_price?: Money;
  inventory: Inventory;
  variants?: Variant[];
  purchase_url: Uri;
  preorder?: boolean;
  ships_from_country_code?: CountryCode;
  /**
   * @maxItems 30
   */
  tags?: string[];
  sources?: {
    provider: string;
    external_id: string;
    url?: Uri;
  }[];
  updated_at?: string;
  /**
   * This interface was referenced by `Product`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
  [k: string]: unknown;
}
/**
 * Lowest variant price when variants differ.
 */
export interface Money1 {
  /**
   * Major units (e.g. 35.00 USD). Publishers SHOULD emit at most 2 decimals; consumers MUST NOT do arithmetic on this without converting to minor units.
   */
  amount: number;
  currency: Currency;
}
/**
 * Aggregated across variants.
 */
export interface Inventory {
  in_stock: boolean;
  /**
   * null when the merchant does not expose counts.
   */
  quantity_remaining?: number | null;
  /**
   * Publisher-defined threshold hint for UI badges.
   */
  low_stock?: boolean;
  restock_at?: string;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "variant".
 */
export interface Variant {
  variant_id: Id;
  /**
   * e.g. 'Black / L', 'Clear vinyl'.
   */
  name: string;
  sku?: string;
  price?: Money;
  inventory?: Inventory1;
  purchase_url?: Uri;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "inventory".
 */
export interface Inventory1 {
  in_stock: boolean;
  /**
   * null when the merchant does not expose counts.
   */
  quantity_remaining?: number | null;
  /**
   * Publisher-defined threshold hint for UI badges.
   */
  low_stock?: boolean;
  restock_at?: string;
}
/**
 * This interface was referenced by `ArtistJson`'s JSON-Schema
 * via the `definition` "link".
 */
export interface Link {
  label: string;
  url: Uri;
  kind?:
    "newsletter" | "patreon" | "discord" | "press" | "epk" | "booking" | "video" | "playlist" | "podcast" | "other";
  image?: Image;
  expires_at?: string;
}
