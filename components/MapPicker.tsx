"use client";

import { useEffect, useRef, useState } from "react";
import type OlFeature from "ol/Feature";
import type OlMap from "ol/Map";
import type Point from "ol/geom/Point";

import "ol/ol.css";

import { BrandLoader } from "@/components/ui/BrandLoader";
import { Spinner } from "@/components/ui/Spinner";
import { DEFAULT_MAP_CENTER, OSM_TILE_URL } from "@/lib/constants";

export type Coords = { lat: number; lng: number };

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
  const mapRef = useRef<OlMap | null>(null);
  const onChangeRef = useRef(onChange);
  /** ย้ายหมุดไปพิกัดใหม่ ตัวฟังก์ชันสร้างตอนโหลด OpenLayers เสร็จ */
  const applyRef = useRef<((coords: Coords) => void) | null>(null);
  /** true เมื่อพิกัดที่เพิ่งเปลี่ยนมาจากการแตะหรือลากบนแผนที่นี้เอง */
  const localEditRef = useRef(false);
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);

  // เก็บ callback ล่าสุดไว้ใน ref เพื่อให้ effect ที่สร้างแผนที่รันครั้งเดียวได้
  // โดยที่ event handler ยังเรียก onChange ตัวใหม่เสมอ
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;

    // โหลด OpenLayers ตอน effect ทำงานเท่านั้น โมดูลของมันแตะ document ตั้งแต่ตอน import
    // ถ้า import ไว้บนสุดของไฟล์ การ render ฝั่ง server จะพัง
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
        { default: Translate },
        { fromLonLat, toLonLat },
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
        import("ol/interaction/Translate"),
        import("ol/proj"),
        import("ol/style"),
      ]);

      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value ?? DEFAULT_MAP_CENTER;
      const source = new VectorSource();
      const pin: OlFeature<Point> = new Feature(
        new PointGeometry(fromLonLat([start.lng, start.lat])),
      );
      // ยังไม่ปักหมุดก็ยังไม่ต้องมีจุดบนแผนที่ ให้เห็นว่าช่องนี้ยังว่าง
      if (value) source.addFeature(pin);

      const pinLayer = new VectorLayer({
        source,
        style: new Style({
          image: new CircleStyle({
            radius: 10,
            fill: new Fill({ color: "#ffc800" }),
            stroke: new Stroke({ color: "#2a2620", width: 3 }),
          }),
        }),
      });

      const map = new Map({
        target: containerRef.current,
        layers: [new TileLayer({ source: new OSM({ url: OSM_TILE_URL }) }), pinLayer],
        view: new View({
          center: fromLonLat([start.lng, start.lat]),
          zoom: value ? 16 : 11,
          maxZoom: 19,
        }),
      });

      function report(coords: Coords) {
        localEditRef.current = true;
        onChangeRef.current(coords);
      }

      map.on("click", (event) => {
        const [lng, lat] = toLonLat(event.coordinate);
        report({ lat, lng });
      });

      const translate = new Translate({ layers: [pinLayer] });
      translate.on("translateend", () => {
        const coordinate = pin.getGeometry()?.getCoordinates();
        if (!coordinate) return;
        const [lng, lat] = toLonLat(coordinate);
        report({ lat, lng });
      });
      map.addInteraction(translate);

      map.on("pointermove", (event) => {
        if (event.dragging) return;
        const target = map.getTargetElement();
        if (target) target.style.cursor = map.hasFeatureAtPixel(event.pixel) ? "grab" : "crosshair";
      });

      applyRef.current = (coords) => {
        const center = fromLonLat([coords.lng, coords.lat]);
        pin.getGeometry()?.setCoordinates(center);
        if (source.getFeatures().length === 0) source.addFeature(pin);

        // ถ้าผู้ใช้เพิ่งแตะหรือลากเอง อย่าไปเลื่อนแผนที่ใต้มือเขา
        // เลื่อนเฉพาะตอนพิกัดมาจากที่อื่น เช่น หลังแกะลิงก์ Google หรือเลือกผลค้นหา
        if (localEditRef.current) {
          localEditRef.current = false;
          return;
        }

        const view = map.getView();
        const current = view.getCenter();
        const [lng, lat] = current ? toLonLat(current) : [Number.NaN, Number.NaN];
        const moved =
          !Number.isFinite(lat) ||
          Math.abs(lat - coords.lat) > 0.0005 ||
          Math.abs(lng - coords.lng) > 0.0005;
        if (moved) {
          view.animate({
            center,
            zoom: Math.max(view.getZoom() ?? 16, 16),
            duration: 300,
          });
        }
      };

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      applyRef.current = null;
      mapRef.current?.setTarget(undefined);
      mapRef.current?.dispose();
      mapRef.current = null;
    };
    // ตั้งใจให้รันครั้งเดียว ตำแหน่งเริ่มต้นอ่านตอน mount ส่วนการอัปเดตอยู่ใน effect ถัดไป
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ซิงก์หมุดเมื่อพิกัดถูกเปลี่ยนจากที่อื่น
  useEffect(() => {
    if (!ready || !value) return;
    applyRef.current?.(value);
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
      <div className="relative" style={{ height }}>
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden rounded-2xl border border-line bg-raised transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        />

        {/* โมดูลของ OpenLayers กับ tile ชุดแรกใช้เวลาโหลดอยู่ไม่กี่ร้อยมิลลิวินาที
            ถ้าปล่อยว่างไว้มันจะเป็นสี่เหลี่ยมเทาเปล่าๆ ที่ดูเหมือนแผนที่เสีย */}
        {ready ? null : (
          <div className="absolute inset-0 grid place-items-center rounded-2xl border border-line bg-raised">
            <div className="flex flex-col items-center gap-2">
              <BrandLoader size={64} />
              <span className="text-xs text-muted">กำลังเปิดแผนที่</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>แตะบนแผนที่เพื่อวางหมุด หรือลากหมุดเพื่อขยับ</span>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="btn btn-secondary px-3 py-1 text-xs"
        >
          {locating ? (
            <>
              <Spinner size={13} />
              กำลังหาตำแหน่ง
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
                <path
                  d="M12 2v3m0 14v3M2 12h3m14 0h3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              ใช้ตำแหน่งปัจจุบัน
            </>
          )}
        </button>
      </div>
    </div>
  );
}
