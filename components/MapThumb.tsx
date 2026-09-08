"use client";

import { useEffect, useRef, useState } from "react";
import type OlMap from "ol/Map";

import "ol/ol.css";

import { BrandLoader } from "@/components/ui/BrandLoader";
import { OSM_TILE_URL } from "@/lib/constants";

/**
 * ภาพแผนที่นิ่งของร้าน ใช้แทนรูปหน้าร้าน
 *
 * ลิงก์ Google Maps ให้รูปจริงของร้านมาไม่ได้ ต้องใช้ Places API ที่คิดเงินเป็นรายครั้ง
 * เลยเอา tile ของ OpenStreetMap มาทำภาพประกอบให้เห็นว่าร้านอยู่ย่านไหนแทน ฟรีและไม่ต้องมี key
 */
export function MapThumb({
  lat,
  lng,
  height = 170,
}: {
  lat: number;
  lng: number;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [
        { default: Map },
        { default: View },
        { default: TileLayer },
        { default: OSM },
        { default: VectorLayer },
        { default: VectorSource },
        { default: Feature },
        { default: PointGeometry },
        { default: Attribution },
        { fromLonLat },
        { Circle: CircleStyle, Fill, Stroke, Style },
      ] = await Promise.all([
        import("ol/Map"),
        import("ol/View"),
        import("ol/layer/Tile"),
        import("ol/source/OSM"),
        import("ol/layer/Vector"),
        import("ol/source/Vector"),
        import("ol/Feature"),
        import("ol/geom/Point"),
        import("ol/control/Attribution"),
        import("ol/proj"),
        import("ol/style"),
      ]);

      if (cancelled || !containerRef.current || mapRef.current) return;

      const center = fromLonLat([lng, lat]);

      mapRef.current = new Map({
        target: containerRef.current,
        // เลื่อนซูมไม่ได้ ตั้งใจให้เป็นภาพนิ่ง ใครอยากดูแผนที่จริงมีหน้าแผนที่ให้แล้ว
        interactions: [],
        // เอา tile ของ OSM ไปใช้ต้องให้เครดิตตามกติกา จึงเปิดป้ายเครดิตค้างไว้
        controls: [new Attribution({ collapsible: false })],
        layers: [
          new TileLayer({ source: new OSM({ url: OSM_TILE_URL }) }),
          new VectorLayer({
            source: new VectorSource({ features: [new Feature(new PointGeometry(center))] }),
            style: new Style({
              image: new CircleStyle({
                radius: 9,
                fill: new Fill({ color: "#ffc800" }),
                stroke: new Stroke({ color: "#2a2620", width: 3 }),
              }),
            }),
          }),
        ],
        view: new View({ center, zoom: 16 }),
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.setTarget(undefined);
      mapRef.current?.dispose();
      mapRef.current = null;
      setReady(false);
    };
  }, [lat, lng]);

  return (
    <div className="relative" style={{ height }}>
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden rounded-2xl border border-line bg-raised transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0 }}
      />

      {ready ? null : (
        <div className="absolute inset-0 grid place-items-center rounded-2xl border border-line bg-raised">
          <BrandLoader size={56} />
        </div>
      )}
    </div>
  );
}
