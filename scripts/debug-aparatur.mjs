import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const nodeFetch = require('node-fetch')
const https = require('node:https')
const agent = new https.Agent({ rejectUnauthorized: false })

async function ft(url) {
  try {
    const r = await nodeFetch(url, { headers: { 'User-Agent': 'PantauDesa/1.0' }, agent, signal: AbortSignal.timeout(15000) })
    if (!r.ok) return null
    return r.text()
  } catch { return null }
}

const sites = [
  { nama: 'Waluya',   url: 'https://waluya.desa.id/aparatur' },
  { nama: 'Sukaluyu', url: 'https://sukaluyu-pangalengan.desa.id/aparatur' },
]

for (const { nama, url } of sites) {
  const html = await ft(url)
  if (!html) { console.log(nama, '→ fetch failed'); continue }
  // Normalise: strip tags, show tokens around "Kepala Desa"
  const tokens = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '|')
    .replace(/\|+/g, '|')
    .replace(/\s+/g, ' ')
    .split('|').map(t => t.trim()).filter(Boolean)

  const idx = tokens.findIndex(t => /^kepala\s+desa$/i.test(t))
  if (idx < 0) { console.log(nama, '→ "Kepala Desa" not found in tokens'); continue }
  console.log(nama, '→ tokens around "Kepala Desa":')
  console.log('  [-2]', tokens[idx-2])
  console.log('  [-1]', tokens[idx-1])
  console.log('  [ 0]', tokens[idx], '← Kepala Desa')
  console.log('  [+1]', tokens[idx+1])
  console.log('  [+2]', tokens[idx+2])
  console.log('  [+3]', tokens[idx+3])
}
