// Test the fixed OpenSID adapter against desa that previously had bad kepala desa values
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL

const { OpenSIDAdapter } = await import('../src/lib/adapters/opensid-adapter.ts')
  .catch(() => import('../src/lib/adapters/opensid-adapter.js'))

// Previously bad: Waluya → "Rapat Koordinasi", Sukaluyu → article title
const testDesas = [
  { desaId: 'test-waluya',   nama: 'Waluya',   kecamatan: 'Pacet',     kabupaten: 'Bandung', provinsi: 'Jawa Barat', kodeDesa: null, website: 'https://waluya.desa.id' },
  { desaId: 'test-sukaluyu', nama: 'Sukaluyu', kecamatan: 'Pangalengan', kabupaten: 'Bandung', provinsi: 'Jawa Barat', kodeDesa: null, website: 'https://sukaluyu-pangalengan.desa.id' },
  { desaId: 'test-tenjolaya', nama: 'Tenjolaya', kecamatan: 'Pasirjambu', kabupaten: 'Bandung', provinsi: 'Jawa Barat', kodeDesa: null, website: 'https://tenjolaya-pasirjambu.desa.id' },
]

const adapter = new OpenSIDAdapter()
const result = await adapter.run({ desas: testDesas })
for (const r of result.results) {
  const desa = testDesas.find(d => d.desaId === r.desaId)
  const kades = r.fields.find(f => f.fieldKey === 'kepalaDesa')
  console.log(desa.nama.padEnd(14), '→ kepalaDesa:', kades?.value ?? '(not found)')
}
