#!/usr/bin/env node
import { createHash } from 'crypto'
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'fs'
import { pipeline } from 'stream/promises'
import { tmpdir } from 'os'
import path from 'path'
import { x as extractTar } from 'tar'

if (existsSync(path.resolve(process.cwd(), '.env'))) {
  process.loadEnvFile()
}

const DATA_DIR = path.resolve(process.cwd(), process.env.GEOIP_DATA_DIR ?? 'data')

function md5File(file: string): string | null {
  if (!existsSync(file)) return null
  return createHash('md5').update(readFileSync(file)).digest('hex')
}

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

  const url = `https://ipinfo.io/data/ipinfo_lite.mmdb?token=${token}`
  const dest = path.join(DATA_DIR, 'ipinfo_lite.mmdb')

  // The redirect target's ETag is the file's md5 — compare it against the local
  // file's own hash instead of tracking state separately.
  const redirect = await fetch(url, { redirect: 'manual' })
  const location = redirect.headers.get('location')
  if (location) {
    const head = await fetch(location, { method: 'HEAD' })
    const remoteMd5 = head.headers.get('etag')?.replace(/"/g, '')
    if (remoteMd5 && remoteMd5 === md5File(dest)) {
      console.log('IPinfo Lite is already up to date')
      return
    }
  }

  console.log('Downloading IPinfo Lite (ASN + country) database...')
  const res = await download(url, {})
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

  const url = 'https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz'
  const auth = Buffer.from(`${accountId}:${licenseKey}`).toString('base64')
  const headers = { Authorization: `Basic ${auth}` }
  const dest = path.join(DATA_DIR, 'GeoLite2-City.mmdb')

  // The ETag is of the .tar.gz, not the extracted .mmdb, so compare dates
  // instead: skip if the remote file is no newer than what we already have.
  if (existsSync(dest)) {
    const head = await fetch(url, { method: 'HEAD', headers })
    const remoteLastModified = head.headers.get('last-modified')
    if (remoteLastModified && new Date(remoteLastModified) <= statSync(dest).mtime) {
      console.log('GeoLite2-City is already up to date')
      return
    }
  }

  console.log('Downloading MaxMind GeoLite2-City database...')
  const res = await download(url, headers)

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'mmdb-geoip-'))
  const tarPath = path.join(tmpDir, 'GeoLite2-City.tar.gz')
  await pipeline(res.body as any, createWriteStream(tarPath))

  await extractTar({ file: tarPath, cwd: tmpDir })
  const extractedDir = readdirSync(tmpDir).find(name => name.startsWith('GeoLite2-City_'))
  if (!extractedDir) throw new Error('Could not find extracted GeoLite2-City directory')

  renameSync(path.join(tmpDir, extractedDir, 'GeoLite2-City.mmdb'), dest)
  rmSync(tmpDir, { recursive: true, force: true })
  console.log(`Wrote ${dest}`)
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true })
  const results = await Promise.allSettled([updateIpinfoLite(), updateMaxmindCity()])
  const failures = results.filter(r => r.status === 'rejected')
  for (const failure of failures) console.error(failure.reason)
  if (failures.length > 0) process.exit(1)
}

main()
