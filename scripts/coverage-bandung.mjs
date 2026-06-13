import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()

const bandung = await db.desa.findMany({
  where: { kabupaten: { contains: 'Bandung', mode: 'insensitive' } },
  select: { id: true, nama: true, kabupaten: true }
})
console.log('Desa Kab. Bandung di DB:', bandung.length)
console.log('Kabupaten unik:', [...new Set(bandung.map(d => d.kabupaten))].join(', '))

const ids = bandung.map(d => d.id)
const keys = ['danaDesa','geoLat','luasWilayah','kepalaDesa','jumlahPenduduk','jumlahKK','jumlahDusun','jumlahRt','jumlahRw','mataPencaharian','kategori','idmScore']

console.log('\n--- Fill rate KHUSUS Kab. Bandung (pilot area) ---')
for (const k of keys) {
  const n = await db.dataDesa.groupBy({ by: ['desaId'], where: { fieldKey: k, status: 'PUBLISHED', isActive: true, desaId: { in: ids } } })
  console.log(k.padEnd(22) + String(n.length).padStart(4) + ' / ' + ids.length + ' = ' + Math.round(n.length/ids.length*100) + '%')
}
const apb = await db.desa.count({ where: { id: { in: ids }, OR: [{ apbdesItems: { some: {} } }, { anggaranSummaries: { some: {} } }] } })
console.log('hasApbdesDetail'.padEnd(22) + String(apb).padStart(4) + ' / ' + ids.length + ' = ' + Math.round(apb/ids.length*100) + '%')

await db.$disconnect()
