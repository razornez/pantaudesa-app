import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()

const all = await db.dataDesa.findMany({
  where: { fieldKey: 'kepalaDesa', status: 'PUBLISHED', desa: { kabupaten: { contains: 'Bandung' } } },
  select: { id: true, valueText: true, desa: { select: { nama: true } } }
})

const badWords = /rapat|koordinasi|kunjungan|belajar|perpanjangan|settings|galeri|agenda|selamat datang|beranda|login|publikasi|kegiatan|sosialisasi|musyawarah|program|bantuan|distribusi|penyerahan|sambutan|berita|pengumuman|lakukan|melakukan/i
const bad = all.filter(r => badWords.test(r.valueText ?? ''))

console.log('Rollback', bad.length, 'suspect kepalaDesa rows → DRAFT')
if (bad.length === 0) { console.log('Nothing to fix.'); await db.$disconnect(); process.exit(0) }

const ids = bad.map(r => r.id)
const result = await db.dataDesa.updateMany({ where: { id: { in: ids } }, data: { status: 'DRAFT', isActive: false } })
console.log('Updated:', result.count, 'rows to DRAFT/inactive')
bad.forEach(r => console.log(' ', r.desa.nama.padEnd(22), '→ ROLLED BACK:', r.valueText))

await db.$disconnect()
