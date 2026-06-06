"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "./geo-types";

const POI_COLOR: Record<GeoPoint["poi"][number]["jenis"], string> = {
  kantor: "#1E1B4B",
  pendidikan: "#0EA5E9",
  kesehatan: "#F43F5E",
  ibadah: "#8B5CF6",
};

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px rgba(255,255,255,.92),0 2px 6px rgba(15,23,42,.35)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function LeafletMap({ geo }: { geo: GeoPoint }) {
  return (
    <MapContainer
      center={[geo.lat, geo.lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geo.poi.map((p, i) => (
        <Marker key={`${p.label}-${i}`} position={[p.lat, p.lng]} icon={dotIcon(POI_COLOR[p.jenis])}>
          <Popup>{p.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
