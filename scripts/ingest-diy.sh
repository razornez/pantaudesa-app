#!/usr/bin/env bash
# ============================================================
# DI Yogyakarta ingestion sweep (4 kabupaten + 1 kota)
#
# LANGKAH 1 — buat desa master:
#   npx tsx scripts/create-desa-master.ts --provinsi "DI Yogyakarta"
#
# LANGKAH 2 — jalankan adapter:
#   bash scripts/ingest-diy.sh idm
#   bash scripts/ingest-diy.sh djpk
#   bash scripts/ingest-diy.sh osm
#   bash scripts/ingest-diy.sh dukcapil
#   bash scripts/ingest-diy.sh elevation   ← setelah osm selesai
#   bash scripts/ingest-diy.sh opensid
#
# Resume jika terhenti:
#   bash scripts/ingest-diy.sh osm --resume-from Gunungkidul
#
# Monitor:
#   npx tsx scripts/monitor-ingest.ts --provinsi "DI Yogyakarta" --watch
# ============================================================

cd "$(dirname "$0")/.." || exit 1

TSX=./node_modules/.bin/tsx
PASS=${1:-all}

RESUME_FROM=""
for i in "$@"; do
  if [[ "$i" == "--resume-from" ]]; then
    RESUME_FROM_NEXT=1
  elif [[ -n "$RESUME_FROM_NEXT" ]]; then
    RESUME_FROM="$i"
    RESUME_FROM_NEXT=""
  fi
done

DIY_KABS=(
  Bantul
  Gunungkidul
  "Kulon Progo"
  Sleman
  "Kota Yogyakarta"
)

run_adapter() {
  local adapter=$1; local skip_field=$2
  local skipping=1
  [[ -z "$RESUME_FROM" ]] && skipping=0
  echo "=== Adapter: $adapter ==="
  [[ $skipping -eq 1 ]] && echo "  (skip sampai: $RESUME_FROM)"
  for kab in "${DIY_KABS[@]}"; do
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

if [[ "$PASS" == "idm" || "$PASS" == "all" ]]; then
  run_adapter "kemendesa-idm" "kategori"
fi

if [[ "$PASS" == "djpk" || "$PASS" == "all" ]]; then
  run_adapter "kemendesa-danadesa" "danaDesa"
fi

if [[ "$PASS" == "osm" || "$PASS" == "all" ]]; then
  run_adapter "osm-overpass" "geoLat"
fi

if [[ "$PASS" == "dukcapil" || "$PASS" == "all" ]]; then
  run_adapter "dukcapil-gis" "jumlahPenduduk"
fi

if [[ "$PASS" == "elevation" || "$PASS" == "all" ]]; then
  run_adapter "openmeteo-elevation" "topografi"
fi

if [[ "$PASS" == "opensid" || "$PASS" == "all" ]]; then
  run_adapter "opensid" "kepalaDesa"
fi

echo ""
echo "=== Coverage check DI Yogyakarta ==="
npx tsx scripts/monitor-ingest.ts --provinsi "DI Yogyakarta"
