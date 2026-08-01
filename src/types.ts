export interface GeoIpInfo {
  ip: string
  isp?: string
  asn?: string
  domain?: string
  country?: {
    name: string
    code: string
  }
  city?: string
  postal?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  accuracy?: number
}

export interface GeoIpServiceOptions {
  /** Path to the IPinfo Lite ASN/country MMDB file. Defaults to `<dataDir>/ipinfo_lite.mmdb`. */
  asnDbPath?: string
  /** Path to the MaxMind GeoLite2-City MMDB file. Defaults to `<dataDir>/GeoLite2-City.mmdb`. */
  cityDbPath?: string
  /** Directory to look for the default MMDB filenames in. Defaults to `./data` next to the package, or `GEOIP_DATA_DIR`. */
  dataDir?: string
}
