import * as mmdb from 'mmdb-lib'
import type { CityResponse } from 'mmdb-lib'
import { readFileSync } from 'fs'
import path from 'path'
import type { GeoIpInfo, GeoIpServiceOptions } from './types.js'
import { isPublicIp } from './ip.js'

interface IpinfoLiteResponse {
  asn?: string
  as_name?: string
  as_domain?: string
}

export class GeoIpService {
  private asnReader: mmdb.Reader<any>
  private geoReader: mmdb.Reader<CityResponse>

  constructor(options: GeoIpServiceOptions = {}) {
    const dataDir = options.dataDir ?? path.resolve(process.cwd(), process.env.GEOIP_DATA_DIR ?? 'data')
    const asnDbPath = options.asnDbPath ?? `${dataDir}/ipinfo_lite.mmdb`
    const cityDbPath = options.cityDbPath ?? `${dataDir}/GeoLite2-City.mmdb`

    this.asnReader = new mmdb.Reader(readFileSync(asnDbPath))
    this.geoReader = new mmdb.Reader(readFileSync(cityDbPath))
  }

  get(ip: string): GeoIpInfo {
    const info: GeoIpInfo = { ip }

    if (!isPublicIp(ip)) return info

    try {
      const asn = this.asnReader.get(ip) as IpinfoLiteResponse | null
      if (asn) {
        info.isp = asn.as_name
        info.asn = asn.asn
        info.domain = asn.as_domain
      }
    } catch {}

    try {
      const city = this.geoReader.get(ip)
      if (city) {
        if (city.country) {
          info.country = {
            name: city.country.names?.en,
            code: city.country.iso_code,
          }
        }
        info.city = city.city?.names?.en
        info.postal = city.postal?.code
        if (city.location) {
          info.coordinates = {
            latitude: city.location.latitude,
            longitude: city.location.longitude,
          }
          info.accuracy = city.location.accuracy_radius
        }
      }
    } catch {}

    return info
  }
}

export function createGeoIpService(options?: GeoIpServiceOptions): GeoIpService {
  return new GeoIpService(options)
}
