import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()
const sample = await db.desa.findMany({
  where: { kabupaten: { contains: 'Bandung', mode: 'insensitive' }, NOT: { kabupaten: { contains: 'Barat', mode: 'insensitive' } } },
  select: { nama: true, kecamatan: true, kodeDesa: true },
  take: 8
})
console.log('Sample desa with kodeDesa:')
sample.forEach(d => console.log(`  ${d.kecamatan.padEnd(20)} ${d.nama.padEnd(22)} kodeDesa=${d.kodeDesa}`))
const withKode = await db.desa.count({ where: { kabupaten: { contains: 'Bandung', mode: 'insensitive' }, NOT: [{ kabupaten: { contains: 'Barat', mode: 'insensitive' } }, { kodeDesa: null }] } })
const total = await db.desa.count({ where: { kabupaten: { contains: 'Bandung', mode: 'insensitive' }, NOT: { kabupaten: { contains: 'Barat', mode: 'insensitive' } } } })
console.log(`\nWith kodeDesa: ${withKode} / ${total}`)
await db.$disconnect()
