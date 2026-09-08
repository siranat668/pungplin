"use client";

import { useEffect, useRef } from "react";
import type { MapLibreMap } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { DEFAULT_MAP_CENTER } from "@/lib/constants";
import { formatScore, scoreColor } from "@/lib/scores";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visitCount: number;
  averageScore: number | null;
  category: string | null;
};

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createPin(pin: MapPin): HTMLDivElement {
  const element = document.createElement("div");
  element.style.cssText = [
    "display:grid",
    "place-items:center",
    "width:30px",
    "height:30px",
    "border-radius:999px",
    `background:${scoreColor(pin.averageScore)}`,
    "border:2px solid var(--color-ink)",
    "box-shadow:0 2px 8px rgba(0,0,0,.5)",
    "color:#0b0b10",
    "font-size:11px",
    "font-weight:800",
    "cursor:pointer",
  ].join(";");
  element.textContent = formatScore(pin.averageScore);
  return element;
}

export function MapOverview({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
        zoom: 10,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      for (const pin of pins) {
        const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
          `<div style="font-family:inherit;min-width:150px">
             <strong style="display:block;font-size:14px">${escapeHtml(pin.name)}</strong>
             <span style="font-size:12px;color:#555">
               ไป ${pin.visitCount} ครั้ง · ${formatScore(pin.averageScore)}/5
             </span>
             <a href="/restaurant/${pin.id}"
                style="display:block;margin-top:6px;font-size:13px;font-weight:700;color:#b58100">
               ดูรายละเอียด
             </a>
           </div>`,
        );

        new maplibregl.Marker({ element: createPin(pin) })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(popup)
          .addTo(map);
      }

      // ซูมให้เห็นทุกหมุดพอดีจอ
      if (pins.length === 1) {
        map.setCenter([pins[0].lng, pins[0].lat]);
        map.setZoom(15);
      } else if (pins.length > 1) {
        const bounds = new maplibregl.LngLatBounds(
          [pins[0].lng, pins[0].lat],
          [pins[0].lng, pins[0].lat],
        );
        for (const pin of pins) bounds.extend([pin.lng, pin.lat]);
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [pins]);

  return (
    <div
      ref={containerRef}
      className="h-[60vh] min-h-80 w-full overflow-hidden rounded-2xl border border-line bg-raised"
    />
  );
}
