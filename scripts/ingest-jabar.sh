#!/usr/bin/env bash
# ============================================================
# Jawa Barat full ingestion sweep — run in YOUR terminal
# (not via Claude Code harness which auto-backgrounds long runs)
#
# Usage:
#   bash scripts/ingest-jabar.sh osm        → koordinat OSM
#   bash scripts/ingest-jabar.sh opensid    → demografi OpenSID
#   bash scripts/ingest-jabar.sh kecamatan  → luas wilayah Kab Bandung only
#   bash scripts/ingest-jabar.sh all        → semua adapter
#
# Each kabupaten is run sequentially — idempotent via --skip-have.
# ============================================================

cd "$(dirname "$0")/.." || exit 1

TSX=./node_modules/.bin/tsx
PASS=${1:-all}

JABAR_KABS=(
  Bogor Sukabumi Cianjur Bandung Garut Tasikmalaya
  Ciamis Kuningan Cirebon Majalengka Sumedang Indramayu
  Subang Purwakarta Karawang Bekasi Bandung\ Barat Pangandaran
  "Kota Bogor" "Kota Sukabumi" "Kota Bandung" "Kota Cirebon"
  "Kota Bekasi" "Kota Depok" "Kota Cimahi" "Kota Tasikmalaya"
  "Kota Banjar"
)

run_adapter() {
  local adapter=$1; local skip_field=$2
  echo "=== Adapter: $adapter ==="
  for kab in "${JABAR_KABS[@]}"; do
    printf "  %-30s " "$kab"
    $TSX scripts/ingest-run.ts --kabupaten "$kab" --only "$adapter" \
      ${skip_field:+--skip-have "$skip_field"} 2>&1 \
      | grep -E "\[$adapter" | head -1 || echo "(no output)"
  done
}

if [[ "$PASS" == "osm" || "$PASS" == "all" ]]; then
  run_adapter "osm" "geoLat"
fi

# Nominatim: fallback geocoder for desa Overpass missed. Run AFTER osm pass.
# Nominatim rate-limits to 1 req/s — allow a few hours after OSM pass before running.
if [[ "$PASS" == "nominatim" || "$PASS" == "all" ]]; then
  run_adapter "nominatim" "geoLat"
fi

# LocationIQ: keyed OSM geocoder that works from cloud and isn't blocked like
# Nominatim. Needs LOCATIONIQ_KEY in env. Run as: bash scripts/ingest-jabar.sh locationiq
if [[ "$PASS" == "locationiq" ]]; then
  run_adapter "locationiq" "geoLat"
fi

if [[ "$PASS" == "opensid" || "$PASS" == "all" ]]; then
  run_adapter "opensid" "jumlahPenduduk"
fi

if [[ "$PASS" == "kecamatan" || "$PASS" == "all" ]]; then
  echo "=== Adapter: kecamatan-bandung (Kab Bandung only) ==="
  $TSX scripts/ingest-run.ts --kabupaten Bandung --only kecamatan --skip-have luasWilayah 2>&1 \
    | grep "kecamatan-bandung" | head -1
fi

echo ""
echo "=== Coverage check ==="
$TSX scripts/ingest-run.ts --kabupaten Bandung --only osm 2>&1 | tail -1  # dummy to trigger db query
$TSX -e "
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', override: false }); loadEnv({ path: '.env', override: false });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
const { db } = await import('./src/lib/db/index.ts');
const f = async (k) => (await db.dataDesa.findMany({where:{fieldKey:k,isActive:true,status:'PUBLISHED',sourceId:{not:null}},select:{desaId:true},distinct:['desaId']})).length;
const total = await db.desa.count({where:{provinsi:{contains:'Jawa Barat',mode:'insensitive'}}});
const [dana,geo,luas,kades,pend] = await Promise.all([f('danaDesa'),f('geoLat'),f('luasWilayah'),f('kepalaDesa'),f('jumlahPenduduk')]);
const p = n => n+'/'+ total+'('+ Math.round(n/total*100)+'%)';
console.log('danaDesa', p(dana), '| geoLat', p(geo), '| luas', p(luas), '| kades', p(kades), '| pend', p(pend));
await db.disconnect();
" 2>&1 | grep -E "danaDesa|ERR"
