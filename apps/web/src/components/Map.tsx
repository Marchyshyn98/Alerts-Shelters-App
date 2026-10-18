"use client";

import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export interface MapPoint {
  id: number | string;
  lat: number;
  lon: number;
  label: string;
}

interface MapProps {
  center: { lat: number; lon: number };
  zoom?: number;
  points: MapPoint[];
  me?: { lat: number; lon: number } | null;
}

export function Map({ center, zoom = 12, points, me }: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!container.current) return;
    map.current = new maplibregl.Map({
      container: container.current,
      style: OSM_STYLE,
      center: [center.lon, center.lat],
      zoom,
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    return () => map.current?.remove();
    // карту створюємо один раз; центр оновлюється окремим ефектом
  }, []);

  useEffect(() => {
    map.current?.flyTo({ center: [center.lon, center.lat] });
  }, [center.lat, center.lon]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = points.map((p) =>
      new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([p.lon, p.lat])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setText(p.label))
        .addTo(m),
    );
    if (me) {
      markers.current.push(
        new maplibregl.Marker({ color: "#dc2626" }).setLngLat([me.lon, me.lat]).addTo(m),
      );
    }
  }, [points, me]);

  return <div ref={container} className="map" />;
}
