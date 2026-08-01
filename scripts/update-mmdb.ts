import { createWriteStream, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync } from 'fs'
import { pipeline } from 'stream/promises'
import { tmpdir } from 'os'
import path from 'path'
import { x as extractTar } from 'tar'

const DATA_DIR = path.resolve(import.meta.dirname, '../data')

async function download(url: string, headers: Record<string, string>): Promise<Response> {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`)
  return res
}

async function updateIpinfoLite() {
  const token = process.env.IPINFO_TOKEN
  if (!token) {
    console.warn('Skipping IPinfo Lite: IPINFO_TOKEN is not set')
    return
  }

  console.log('Downloading IPinfo Lite (ASN + country) database...')
  const res = await download(`https://ipinfo.io/data/ipinfo_lite.mmdb?token=${token}`, {})
  const dest = path.join(DATA_DIR, 'ipinfo_lite.mmdb')
  await pipeline(res.body as any, createWriteStream(dest))
  console.log(`Wrote ${dest}`)
}

async function updateMaxmindCity() {
  const accountId = process.env.MAXMIND_ACCOUNT_ID
  const licenseKey = process.env.MAXMIND_LICENSE_KEY
  if (!accountId || !licenseKey) {
    console.warn('Skipping GeoLite2-City: MAXMIND_ACCOUNT_ID / MAXMIND_LICENSE_KEY are not set')
    return
  }

  console.log('Downloading MaxMind GeoLite2-City database...')
  const auth = Buffer.from(`${accountId}:${licenseKey}`).toString('base64')
  const res = await download(
    'https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz',
    { Authorization: `Basic ${auth}` },
  )

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'mmdb-geoip-'))
  const tarPath = path.join(tmpDir, 'GeoLite2-City.tar.gz')
  await pipeline(res.body as any, createWriteStream(tarPath))

  await extractTar({ file: tarPath, cwd: tmpDir })
  const extractedDir = readdirSync(tmpDir).find(name => name.startsWith('GeoLite2-City_'))
  if (!extractedDir) throw new Error('Could not find extracted GeoLite2-City directory')

  const src = path.join(tmpDir, extractedDir, 'GeoLite2-City.mmdb')
  const dest = path.join(DATA_DIR, 'GeoLite2-City.mmdb')
  renameSync(src, dest)
  rmSync(tmpDir, { recursive: true, force: true })
  console.log(`Wrote ${dest}`)
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true })
  await Promise.all([updateIpinfoLite(), updateMaxmindCity()])
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
