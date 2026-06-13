import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()
const total = await db.desa.count()
console.log('Total desa:', total)

// DataDesa field keys — filter PUBLISHED only
const keys = ['danaDesa','geoLat','luasWilayah','kepalaDesa','jumlahPenduduk','jumlahKK','jumlahDusun','jumlahRt','jumlahRw','mataPencaharian']
for (const k of keys) {
  const n = await db.dataDesa.groupBy({ by: ['desaId'], where: { fieldKey: k, status: 'PUBLISHED' } })
  console.log(k.padEnd(22) + String(n.length).padStart(5) + ' / ' + total + ' = ' + Math.round(n.length/total*100) + '%')
}
console.log('---')
const pend = await db.desa.count({ where: { jumlahPenduduk: { gt: 0 } } })
console.log('jumlahPenduduk(col)'.padEnd(22) + String(pend).padStart(5) + ' / ' + total + ' = ' + Math.round(pend/total*100) + '%')
const src = await db.desa.count({ where: { OR: [{ dataSources: { some: {} } }, { websiteUrl: { not: null } }, { dataDesa: { some: { status: 'PUBLISHED' } } }] } })
console.log('hasSource'.padEnd(22) + String(src).padStart(5) + ' / ' + total + ' = ' + Math.round(src/total*100) + '%')
const doc = await db.desa.count({ where: { dokumenPublik: { some: { dataStatus: { not: 'demo' } } } } })
console.log('dokumenPublik'.padEnd(22) + String(doc).padStart(5) + ' / ' + total + ' = ' + Math.round(doc/total*100) + '%')
const apb = await db.desa.count({ where: { OR: [{ apbdesItems: { some: {} } }, { anggaranSummaries: { some: {} } }] } })
console.log('hasApbdesDetail'.padEnd(22) + String(apb).padStart(5) + ' / ' + total + ' = ' + Math.round(apb/total*100) + '%')
const kat = await db.desa.count({ where: { kategori: { not: null, notIn: ['','demo'] } } })
console.log('kategori'.padEnd(22) + String(kat).padStart(5) + ' / ' + total + ' = ' + Math.round(kat/total*100) + '%')
await db.$disconnect()
