"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "./geo-types";

// Leaflet touches `window`, so load the actual map client-only (no SSR).
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[.04]" />,
});

export default function PetaMap({ geo }: { geo: GeoPoint }) {
  return <LeafletMap geo={geo} />;
}
