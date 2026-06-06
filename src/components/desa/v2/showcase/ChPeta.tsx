import ChapterPanel from "../ChapterPanel";
import PetaMap from "./PetaMap";
import type { GeoPoint } from "./geo-types";

const LEGEND = [
  { label: "Kantor desa", color: "#1E1B4B" },
  { label: "Pendidikan", color: "#0EA5E9" },
  { label: "Kesehatan", color: "#F43F5E" },
  { label: "Ibadah", color: "#8B5CF6" },
];

export default function ChPeta({
  chapterNo,
  geo,
  namaDesa,
  coordSourceLabel,
}: {
  chapterNo: string;
  geo: GeoPoint;
  namaDesa: string;
  /** When set, the center coordinates are REAL (from this source). POI stay demo. */
  coordSourceLabel?: string | null;
}) {
  return (
    <ChapterPanel
      id={`ch-${chapterNo}`}
      chapterNo={chapterNo}
      ribbonLabel="PETA DESA"
      ribbonDot="var(--color-teal-500)"
      stripGradient="linear-gradient(90deg,#14B8A6,#0EA5E9,#4F46E5)"
      tagText={coordSourceLabel ? "LOKASI & FASILITAS" : "LOKASI & FASILITAS · (MOCK)"}
      tagClass="ch-tag-teal"
      sourceNote={
        coordSourceLabel
          ? { label: `${coordSourceLabel} (node desa)`, mock: false, url: "https://www.openstreetmap.org" }
          : { label: "OpenStreetMap (Overpass)", mock: true }
      }
      headline={
        <>
          Di mana {namaDesa} dan <span className="underline-sweep">fasilitas pentingnya</span> berada
          ({geo.topografi.toLowerCase()}).
        </>
      }
    >
      <div className="reveal reveal-4 overflow-hidden rounded-2xl ring-hair" style={{ height: 380 }}>
        <PetaMap geo={geo} />
      </div>
      <div className="reveal reveal-5 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-3">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: l.color }} aria-hidden />
            {l.label}
          </span>
        ))}
        <span className="mono ml-auto text-[10px] text-ink-4">
          {coordSourceLabel
            ? `Koordinat asli · sumber: ${coordSourceLabel} · titik fasilitas masih contoh`
            : "(mock) titik & koordinat contoh · OSM"}
        </span>
      </div>
    </ChapterPanel>
  );
}
