import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()

const all = await db.dataDesa.findMany({
  where: { fieldKey: 'kepalaDesa', status: 'PUBLISHED', desa: { kabupaten: { contains: 'Bandung' } } },
  select: { id: true, valueText: true, desa: { select: { nama: true } } }
})

const badWords = /rapat|koordinasi|kunjungan|belajar|perpanjangan|settings|galeri|agenda|selamat datang|beranda|login|publikasi|kegiatan|sosialisasi|musyawarah|program|bantuan|distribusi|penyerahan|sambutan|berita|pengumuman|lakukan|melakukan/i

const bad = all.filter(r => badWords.test(r.valueText ?? ''))
const ok  = all.filter(r => !badWords.test(r.valueText ?? ''))

console.log('Total kepalaDesa Bandung:', all.length)
console.log('Terlihat valid:          ', ok.length)
console.log('SUSPECT (salah parser):  ', bad.length)
console.log('')
if (bad.length > 0) {
  console.log('=== Contoh yang suspect ===')
  bad.slice(0, 15).forEach(r => console.log(' ', r.desa.nama.padEnd(22), '→', r.valueText))
}

await db.$disconnect()
