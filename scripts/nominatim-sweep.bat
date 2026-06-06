@echo off
REM Run Nominatim geocoding for all Jawa Barat desa missing coordinates
REM Execute from: c:\xampp\htdocs\pantaudesa
REM Rate: 1 req/sec per Nominatim policy (~55 min for 3300 desa)
echo Starting Nominatim geocoding sweep...
echo.
node_modules\.bin\tsx scripts\ingest-run.ts --all --only nominatim --skip-have geoLat
echo.
echo Done. Check coverage:
node_modules\.bin\tsx -e "import {config} from 'dotenv'; config({path:'.env.local'}); config({path:'.env'}); if(process.env.DIRECT_URL) process.env.DATABASE_URL=process.env.DIRECT_URL; const {PrismaClient} = await import('./src/generated/prisma/index.js'); const db=new PrismaClient(); const geo=(await db.dataDesa.findMany({where:{fieldKey:'geoLat',isActive:true,status:'PUBLISHED',sourceId:{not:null}},select:{desaId:true},distinct:['desaId']})).length; const total=await db.desa.count({where:{provinsi:{contains:'Jawa Barat'}}}); console.log('geoLat:',geo+'/'+ total+'('+Math.round(geo/total*100)+'%%)'); await db.$disconnect();"
