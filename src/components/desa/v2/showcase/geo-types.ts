// Shared geo type for the detail-page map components (ChPeta / PetaMap /
// LeafletMap). Extracted from the removed showcase-demo module so the real
// (non-showcase) detail map no longer depends on demo code.

export interface GeoPoint {
  lat: number;
  lng: number;
  topografi: string;
  poi: {
    label: string;
    jenis: "pendidikan" | "kesehatan" | "ibadah" | "kantor";
    lat: number;
    lng: number;
  }[];
}
