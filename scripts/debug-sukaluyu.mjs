// Quick debug: what does Sukaluyu homepage look like for kepala desa parsing?
const r = await fetch('https://sukaluyu-pangalengan.desa.id/', {
  headers: { 'User-Agent': 'PantauDesa/1.0' },
  signal: AbortSignal.timeout(20000),
})
if (!r.ok) { console.log('fetch failed', r.status); process.exit(1) }
const html = await r.text()

// 1. Check var config
const cfgMatch = html.match(/var\s+config\s*=\s*(\{[\s\S]*?\});/)
if (cfgMatch) {
  try {
    const cfg = JSON.parse(cfgMatch[1])
    console.log('nama_kepala_desa in config:', cfg.nama_kepala_desa)
  } catch (e) { console.log('config parse error:', e.message) }
} else {
  console.log('var config not found in page')
}

// 2. Check Pattern A (after stripping img tags + regular tags)
const text = html
  .replace(/<img[^>]*>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')

const matches = [...text.matchAll(/Kepala Desa\s*[:\-]?\s+((?:[A-Z][A-Za-z.'']*,?\s*){2,5})/g)]
console.log('\nPattern A matches:')
for (const m of matches.slice(0, 5)) {
  console.log(' ', JSON.stringify(m[1]))
}
