#!/usr/bin/env bash
# ============================================================
# Papua (semua sub-provinsi) ingestion sweep
#
# Papua sejak 2022 dipecah menjadi 6 provinsi. Jalankan
# create-desa-master untuk SETIAP nama provinsi:
#
# LANGKAH 1 — buat desa master (jalankan SEMUA ini dulu):
#   npx tsx scripts/create-desa-master.ts --provinsi "Papua"          ← IDM 94 = Papua Tengah
#   npx tsx scripts/create-desa-master.ts --provinsi "Papua Barat"    ← IDM 91 = Papua induk
#   npx tsx scripts/create-desa-master.ts --provinsi "Papua Selatan"  ← IDM 93
#   npx tsx scripts/create-desa-master.ts --provinsi "Papua Pegunungan" ← IDM 95
#   npx tsx scripts/create-desa-master.ts --provinsi "Papua Barat Daya" ← IDM 92
#
# LANGKAH 2 — jalankan adapter:
#   bash scripts/ingest-papua.sh idm
#   bash scripts/ingest-papua.sh djpk
#   bash scripts/ingest-papua.sh osm
#   bash scripts/ingest-papua.sh dukcapil
#   bash scripts/ingest-papua.sh elevation   ← setelah osm selesai
#   bash scripts/ingest-papua.sh opensid
#
# Resume jika terhenti:
#   bash scripts/ingest-papua.sh osm --resume-from Jayapura
#
# Monitor (terminal terpisah):
#   npx tsx scripts/monitor-ingest.ts --provinsi "Papua" --watch
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

PAPUA_KABS=(
  # Papua Barat (IDM code 91) — 9 entries (termasuk Kota Jayapura)
  Jayapura Sarmi Keerom Waropen "Kepulauan Yapen" "Biak Numfor" Supiori "Mamberamo Raya"
  "Kota Jayapura"

  # Papua Selatan (IDM code 93) — 4 kabupaten
  Merauke "Boven Digoel" Mappi Asmat

  # Papua (IDM code 94, = Papua Tengah) — 8 kabupaten
  Nabire Paniai "Puncak Jaya" Mimika Dogiyai "Intan Jaya" Deiyai Puncak

  # Papua Pegunungan (IDM code 95) — 8 kabupaten
  Jayawijaya "Pegunungan Bintang" Tolikara Yahukimo "Mamberamo Tengah" Yalimo "Lanny Jaya" Nduga

  # Papua Barat Daya (IDM code 92) — 12 kabupaten
  "Fak Fak" Kaimana "Teluk Wondama" "Teluk Bintuni" Manokwari "Sorong Selatan" Tambrauw Maybrat
  "Manokwari Selatan" "Pegunungan Arfak" "Raja Ampat" Sorong
)

run_adapter() {
  local adapter=$1; local skip_field=$2
  local skipping=1
  [[ -z "$RESUME_FROM" ]] && skipping=0
  echo "=== Adapter: $adapter ==="
  [[ $skipping -eq 1 ]] && echo "  (skip sampai: $RESUME_FROM)"
  for kab in "${PAPUA_KABS[@]}"; do
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
echo "=== Coverage check Papua ==="
npx tsx scripts/monitor-ingest.ts --provinsi "Papua"
