import { PrismaClient } from '../src/generated/prisma/index.js'
const db = new PrismaClient()

const idmSource = await db.dataSource.findUnique({ where: { id: 'IDM' } })
console.log('IDM DataSource:', idmSource ? 'EXISTS' : 'MISSING')

// Active + published
const activePublished = await db.dataDesa.findMany({
  where: { fieldKey: 'kategori', isActive: true, status: 'PUBLISHED', desa: { kabupaten: { contains: 'Bandung', mode: 'insensitive' }, NOT: { kabupaten: { contains: 'Barat', mode: 'insensitive' } } } },
  select: { valueText: true, sourceId: true, isActive: true, desa: { select: { nama: true } } },
  take: 5
})
console.log('\nActive+Published kategori sample:')
activePublished.forEach(r => console.log(' ', r.desa.nama.padEnd(20), 'val:', r.valueText, 'sourceId:', r.sourceId))

const countAll = await db.dataDesa.count({ where: { fieldKey: 'kategori', desa: { kabupaten: { contains: 'Bandung' }, NOT: { kabupaten: { contains: 'Barat' } } } } })
const countActive = await db.dataDesa.count({ where: { fieldKey: 'kategori', isActive: true, status: 'PUBLISHED', desa: { kabupaten: { contains: 'Bandung' }, NOT: { kabupaten: { contains: 'Barat' } } } } })
const countWithSrc = await db.dataDesa.count({ where: { fieldKey: 'kategori', isActive: true, status: 'PUBLISHED', sourceId: { not: null }, desa: { kabupaten: { contains: 'Bandung' }, NOT: { kabupaten: { contains: 'Barat' } } } } })

console.log(`\nAll kategori (Bandung): ${countAll}`)
console.log(`isActive+PUBLISHED: ${countActive}`)
console.log(`isActive+PUBLISHED+sourceId: ${countWithSrc}`)

// Also check idmScore
const idmScoreCount = await db.dataDesa.count({ where: { fieldKey: 'idmScore', isActive: true, status: 'PUBLISHED', desa: { kabupaten: { contains: 'Bandung' }, NOT: { kabupaten: { contains: 'Barat' } } } } })
console.log(`idmScore isActive+PUBLISHED: ${idmScoreCount}`)

await db.$disconnect()
