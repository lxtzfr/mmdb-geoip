# mmdb-geoip

GeoIP lookups from MMDB files: ASN/ISP and country data from [IPinfo Lite](https://ipinfo.io/lite),
city-level geolocation from [MaxMind GeoLite2-City](https://www.maxmind.com/en/accounts/current/geoip/downloads).

## Install

```sh
npm install mmdb-geoip
```

This package does not ship the `.mmdb` database files (their licenses don't allow redistribution).
You need to download them yourself with the bundled script, or point the service at files you already have.

## Downloading the databases

```sh
IPINFO_TOKEN=xxx \
MAXMIND_ACCOUNT_ID=xxx \
MAXMIND_LICENSE_KEY=xxx \
npm run update-mmdb
```

- `IPINFO_TOKEN`: free token from your [IPinfo dashboard](https://ipinfo.io/signup).
- `MAXMIND_ACCOUNT_ID` / `MAXMIND_LICENSE_KEY`: from your [MaxMind account](https://www.maxmind.com/en/accounts/current/license-key).

Either pair can be omitted to skip that database. Files are written to `./data` next to the package
(or wherever `GEOIP_DATA_DIR` points).

## Usage

```ts
import { createGeoIpService } from 'mmdb-geoip'

const geoIp = createGeoIpService()
geoIp.get('8.8.8.8')
// {
//   ip: '8.8.8.8',
//   isp: 'Google LLC',
//   asn: 'AS15169',
//   domain: 'google.com',
//   country: { name: 'United States', code: 'US' },
//   city: 'Mountain View',
//   coordinates: { latitude: 37.751, longitude: -97.822 },
//   accuracy: 1000
// }
```

Pass explicit paths if you don't want the default `./data` layout:

```ts
createGeoIpService({
  asnDbPath: '/path/to/ipinfo_lite.mmdb',
  cityDbPath: '/path/to/GeoLite2-City.mmdb',
})
```

## License

MIT
