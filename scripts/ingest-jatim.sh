#!/usr/bin/env bash
# ============================================================
# Jawa Timur full ingestion sweep
#
# LANGKAH 1 — buat desa master dulu (jalankan sekali):
#   npx tsx scripts/create-desa-master.ts --provinsi "Jawa Timur"
#
# LANGKAH 2 — jalankan adapter satu per satu:
#   bash scripts/ingest-jatim.sh idm
#   bash scripts/ingest-jatim.sh djpk
#   bash scripts/ingest-jatim.sh osm
#   bash scripts/ingest-jatim.sh dukcapil
#   bash scripts/ingest-jatim.sh elevation   ← jalankan SETELAH osm selesai
#   bash scripts/ingest-jatim.sh opensid     ← paling lambat, bisa berjam-jam
#
# Resume jika terhenti di tengah:
#   bash scripts/ingest-jatim.sh osm --resume-from Malang
#
# Monitor progress (terminal terpisah):
#   npx tsx scripts/monitor-ingest.ts --provinsi "Jawa Timur" --watch
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

JATIM_KABS=(
  # Kabupaten (29)
  Pacitan Ponorogo Trenggalek Tulungagung Blitar Kediri Malang
  Lumajang Jember Banyuwangi Bondowoso Situbondo Probolinggo Pasuruan
  Sidoarjo Mojokerto Jombang Nganjuk Madiun Magetan Ngawi
  Bojonegoro Tuban Lamongan Gresik Bangkalan Sampang Pamekasan Sumenep
  # Kota (9)
  "Kota Kediri" "Kota Blitar" "Kota Malang" "Kota Probolinggo"
  "Kota Pasuruan" "Kota Mojokerto" "Kota Madiun" "Kota Surabaya" "Kota Batu"
)

run_adapter() {
  local adapter=$1; local skip_field=$2
  local skipping=1
  [[ -z "$RESUME_FROM" ]] && skipping=0
  echo "=== Adapter: $adapter ==="
  [[ $skipping -eq 1 ]] && echo "  (skip sampai: $RESUME_FROM)"
  for kab in "${JATIM_KABS[@]}"; do
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

# OpenSID: scraping website per desa — paling lambat, jalankan terakhir
if [[ "$PASS" == "opensid" || "$PASS" == "all" ]]; then
  run_adapter "opensid" "kepalaDesa"
fi

echo ""
echo "=== Coverage check Jawa Timur ==="
npx tsx scripts/monitor-ingest.ts --provinsi "Jawa Timur"
