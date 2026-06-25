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

# Parse --resume-from <kabupaten>
RESUME_FROM=""
for i in "$@"; do
  if [[ "$i" == "--resume-from" ]]; then
    RESUME_FROM_NEXT=1
  elif [[ -n "$RESUME_FROM_NEXT" ]]; then
    RESUME_FROM="$i"
    RESUME_FROM_NEXT=""
  fi
done

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
  local skipping=1
  [[ -z "$RESUME_FROM" ]] && skipping=0
  echo "=== Adapter: $adapter ==="
  [[ $skipping -eq 1 ]] && echo "  (skip sampai: $RESUME_FROM)"
  for kab in "${JABAR_KABS[@]}"; do
    if [[ $skipping -eq 1 ]]; then
      if [[ "$kab" == "$RESUME_FROM" ]]; then
        skipping=0
      else
        echo "  ↷ skip $kab"
        continue
      fi
    fi
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
  run_adapter "opensid" "kepalaDesa"
fi

if [[ "$PASS" == "idm" || "$PASS" == "all" ]]; then
  run_adapter "kemendesa-idm" "kategori"
fi

if [[ "$PASS" == "elevation" || "$PASS" == "all" ]]; then
  run_adapter "openmeteo-elevation" "topografi"
fi

if [[ "$PASS" == "kecamatan" || "$PASS" == "all" ]]; then
  echo "=== Adapter: kecamatan-bandung (Kab Bandung only) ==="
  $TSX scripts/ingest-run.ts --kabupaten Bandung --only kecamatan --skip-have luasWilayah 2>&1 \
    | grep "kecamatan-bandung" | head -1
fi

echo ""
echo "=== Coverage check Jawa Barat ==="
node --input-type=module << 'JSEOF'
import { config } from 'dotenv';
config({ path: '.env.local' });
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
const { PrismaClient } = await import('./src/generated/prisma/index.js');
const db = new PrismaClient();
const f = k => db.dataDesa.findMany({ where:{ fieldKey:k, isActive:true, status:'PUBLISHED', sourceId:{not:null}, desa:{provinsi:{contains:'Jawa Barat'}} }, select:{desaId:true}, distinct:['desaId'] }).then(r=>r.length);
const total = await db.desa.count({ where:{ provinsi:{ contains:'Jawa Barat' } } });
const [dana,geo,pend,kades,kat] = await Promise.all([f('danaDesa'),f('geoLat'),f('jumlahPenduduk'),f('kepalaDesa'),f('kategori')]);
const p = (n,t) => `${n}/${t} (${Math.round(n/t*100)}%)`;
console.log(`danaDesa  : ${p(dana,total)}`);
console.log(`geoLat    : ${p(geo,total)}`);
console.log(`penduduk  : ${p(pend,total)}`);
console.log(`kepalaDesa: ${p(kades,total)}`);
console.log(`kategori  : ${p(kat,total)}`);
await db.$disconnect();
JSEOF
