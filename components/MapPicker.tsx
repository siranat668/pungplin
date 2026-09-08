"use client";

import { useEffect, useRef, useState } from "react";
import type { MapLibreMap, MapMouseEvent, Marker } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { DEFAULT_MAP_CENTER } from "@/lib/constants";

export type Coords = { lat: number; lng: number };

/**
 * สไตล์แผนที่แบบ raster ที่ชี้ไปยัง tile ของ OpenStreetMap โดยตรง
 * ไม่ต้องมี API key ไม่ต้องผูกบัตร จึงไม่มีทางเจอบิลบานปลายแบบ Google Maps
 */
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

function createPinElement(): HTMLDivElement {
  const pin = document.createElement("div");
  pin.style.cssText = [
    "width:22px",
    "height:22px",
    "border-radius:999px",
    "background:var(--color-yolk)",
    "border:3px solid var(--color-ink)",
    "box-shadow:0 0 0 3px rgba(255,200,0,.35)",
    "cursor:grab",
  ].join(";");
  return pin;
}

export function MapPicker({
  value,
  onChange,
  height = 300,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);

  // เก็บ callback ล่าสุดไว้ใน ref เพื่อให้ effect ที่สร้างแผนที่รันครั้งเดียวได้
  // โดยที่ event handler ยังเรียก onChange ตัวใหม่เสมอ
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;

    // โหลด maplibre ตอน effect ทำงานเท่านั้น ไลบรารีนี้แตะ window ตั้งแต่ตอน import
    // ถ้า import ไว้บนสุดของไฟล์ การ render ฝั่ง server จะพัง
    void (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value ?? DEFAULT_MAP_CENTER;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: [start.lng, start.lat],
        zoom: value ? 16 : 11,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const marker = new maplibregl.Marker({
        element: createPinElement(),
        draggable: true,
      });

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLngLat();
        onChangeRef.current({ lat, lng });
      });

      map.on("click", (event: MapMouseEvent) => {
        onChangeRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      });

      if (value) marker.setLngLat([value.lng, value.lat]).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // ตั้งใจให้รันครั้งเดียว ตำแหน่งเริ่มต้นอ่านตอน mount ส่วนการอัปเดตอยู่ใน effect ถัดไป
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ซิงก์หมุดเมื่อพิกัดถูกเปลี่ยนจากที่อื่น เช่น หลังแกะลิงก์ Google หรือเลือกผลค้นหา
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!ready || !map || !marker || !value) return;

    marker.setLngLat([value.lng, value.lat]).addTo(map);

    const center = map.getCenter();
    const moved =
      Math.abs(center.lat - value.lat) > 0.0005 || Math.abs(center.lng - value.lng) > 0.0005;
    if (moved) map.easeTo({ center: [value.lng, value.lat], zoom: Math.max(map.getZoom(), 16) });
  }, [ready, value]);

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChangeRef.current({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full overflow-hidden rounded-2xl border border-line bg-raised"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>แตะบนแผนที่เพื่อวางหมุด หรือลากหมุดเพื่อขยับ</span>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="btn btn-secondary px-3 py-1 text-xs"
        >
          {locating ? "กำลังหาตำแหน่ง" : "ใช้ตำแหน่งปัจจุบัน"}
        </button>
      </div>
    </div>
  );
}
