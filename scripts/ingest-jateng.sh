#!/usr/bin/env bash
# ============================================================
# Jawa Tengah full ingestion sweep — run in YOUR terminal
# (not via Claude Code harness which auto-backgrounds long runs)
#
# Usage:
#   bash scripts/ingest-jateng.sh osm                       → koordinat OSM
#   bash scripts/ingest-jateng.sh osm --resume-from Blora   → lanjut dari Blora
#   bash scripts/ingest-jateng.sh opensid                   → demografi OpenSID
#   bash scripts/ingest-jateng.sh idm                       → IDM score + kategori
#   bash scripts/ingest-jateng.sh djpk                      → Dana Desa
#   bash scripts/ingest-jateng.sh dukcapil                  → penduduk, KK, luas wilayah
#   bash scripts/ingest-jateng.sh elevation                 → topografi (OpenMeteo)
#   bash scripts/ingest-jateng.sh all                       → semua adapter
#
# Prerequisite: desa master records must exist first:
#   npx tsx scripts/create-desa-master.ts --provinsi "Jawa Tengah"
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

JATENG_KABS=(
  # Kabupaten (29)
  Cilacap Banyumas Purbalingga Banjarnegara Kebumen Purworejo Wonosobo
  Magelang Boyolali Klaten Sukoharjo Wonogiri Karanganyar Sragen
  Grobogan Blora Rembang Pati Kudus Jepara Demak Semarang Temanggung
  Kendal Batang Pekalongan Pemalang Tegal Brebes
  # Kota (6)
  "Kota Magelang" "Kota Surakarta" "Kota Salatiga" "Kota Semarang"
  "Kota Pekalongan" "Kota Tegal"
)

run_adapter() {
  local adapter=$1; local skip_field=$2
  local skipping=1
  [[ -z "$RESUME_FROM" ]] && skipping=0
  echo "=== Adapter: $adapter ==="
  [[ $skipping -eq 1 ]] && echo "  (skip sampai: $RESUME_FROM)"
  for kab in "${JATENG_KABS[@]}"; do
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
  run_adapter "osm" "geoLat"
fi

if [[ "$PASS" == "dukcapil" || "$PASS" == "all" ]]; then
  run_adapter "dukcapil-gis" "jumlahPenduduk"
fi

if [[ "$PASS" == "elevation" || "$PASS" == "all" ]]; then
  run_adapter "openmeteo-elevation" "topografi"
fi

# OpenSID: per-desa website scraping — run last, after geo+idm
if [[ "$PASS" == "opensid" || "$PASS" == "all" ]]; then
  run_adapter "opensid" "kepalaDesa"
fi

echo ""
echo "=== Coverage check Jawa Tengah ==="
$TSX scripts/monitor-jateng.ts
