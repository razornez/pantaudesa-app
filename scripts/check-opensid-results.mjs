import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()

const sample = await db.dataDesa.findMany({
  where: { fieldKey: 'kepalaDesa', status: 'PUBLISHED', desa: { kabupaten: { contains: 'Bandung' } } },
  select: { valueText: true, updatedAt: true, desa: { select: { nama: true, websiteUrl: true } } },
  orderBy: { updatedAt: 'desc' },
  take: 8,
})

console.log('=== Kepala Desa terbaru ter-ingest (Bandung) ===')
sample.forEach(r => console.log(
  r.desa.nama.padEnd(22),
  '→', (r.valueText ?? '').padEnd(30),
  '|', r.desa.websiteUrl ?? '(no url, guessed .desa.id)'
))

// Juga cek berapa yang websiteUrl null (artinya URL ditebak dari nama)
const noUrl = await db.dataDesa.count({
  where: {
    fieldKey: 'kepalaDesa', status: 'PUBLISHED',
    desa: { kabupaten: { contains: 'Bandung' }, websiteUrl: null }
  }
})
const hasUrl = await db.dataDesa.count({
  where: {
    fieldKey: 'kepalaDesa', status: 'PUBLISHED',
    desa: { kabupaten: { contains: 'Bandung' }, websiteUrl: { not: null } }
  }
})
console.log('\nDari websiteUrl tersimpan:', hasUrl, '| dari tebakan .desa.id:', noUrl)
await db.$disconnect()
