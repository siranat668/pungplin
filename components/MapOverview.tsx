"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type OlMap from "ol/Map";
import type Overlay from "ol/Overlay";

import "ol/ol.css";

import { DEFAULT_MAP_CENTER, OSM_TILE_URL } from "@/lib/constants";
import { formatScore, scoreFill } from "@/lib/scores";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visitCount: number;
  averageScore: number | null;
  category: string | null;
};

export function MapOverview({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const [selected, setSelected] = useState<MapPin | null>(null);
  /**
   * กล่องของป้ายสร้างด้วย document.createElement เพราะ OpenLayers จะย้ายมันไปไว้
   * ในชั้น overlay ของตัวเอง ถ้าปล่อยให้ React เป็นเจ้าของกล่องนี้ตรงๆ ตอน unmount
   * React จะหา element ไม่เจอในที่ที่มันจำไว้แล้วพัง เลยยกให้ OpenLayers ถือกล่อง
   * แล้วยิงเนื้อหาเข้าไปด้วย portal แทน
   */
  const [popupBox, setPopupBox] = useState<HTMLDivElement | null>(null);

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
        { default: OverlayCtor },
        { fromLonLat },
        { Circle: CircleStyle, Fill, Stroke, Style, Text },
      ] = await Promise.all([
        import("ol/Map"),
        import("ol/View"),
        import("ol/layer/Tile"),
        import("ol/source/OSM"),
        import("ol/layer/Vector"),
        import("ol/source/Vector"),
        import("ol/Feature"),
        import("ol/geom/Point"),
        import("ol/Overlay"),
        import("ol/proj"),
        import("ol/style"),
      ]);

      if (cancelled || !containerRef.current || mapRef.current) return;

      const features = pins.map((pin) => {
        const feature = new Feature(new PointGeometry(fromLonLat([pin.lng, pin.lat])));
        feature.set("pin", pin);
        feature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 15,
              fill: new Fill({ color: scoreFill(pin.averageScore) }),
              stroke: new Stroke({ color: "#ffffff", width: 3 }),
            }),
            // ตัวเลขคะแนนอยู่ในหมุดเลย ไม่ต้องกดดูทีละร้านก็เทียบกันได้
            text: new Text({
              text: formatScore(pin.averageScore),
              font: "700 11px 'Noto Sans Thai', sans-serif",
              fill: new Fill({ color: "#2a2620" }),
            }),
          }),
        );
        return feature;
      });

      const source = new VectorSource({ features });

      const box = document.createElement("div");
      const overlay = new OverlayCtor({
        element: box,
        positioning: "bottom-center",
        offset: [0, -24],
        // ให้คลิกในป้ายไม่ทะลุไปโดนแผนที่ ลิงก์กับปุ่มปิดข้างในจึงกดได้
        stopEvent: true,
      });

      const map = new Map({
        target: containerRef.current,
        layers: [
          new TileLayer({ source: new OSM({ url: OSM_TILE_URL }) }),
          new VectorLayer({ source }),
        ],
        overlays: [overlay],
        view: new View({
          center: fromLonLat([DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat]),
          zoom: 10,
          maxZoom: 19,
        }),
      });

      map.on("click", (event) => {
        const hit = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
        const pin = hit?.get("pin") as MapPin | undefined;

        if (!pin) {
          overlay.setPosition(undefined);
          setSelected(null);
          return;
        }

        overlay.setPosition(fromLonLat([pin.lng, pin.lat]));
        setSelected(pin);
      });

      map.on("pointermove", (event) => {
        if (event.dragging) return;
        const target = map.getTargetElement();
        if (target) target.style.cursor = map.hasFeatureAtPixel(event.pixel) ? "pointer" : "";
      });

      // view.fit ต้องรู้ขนาดกล่องก่อน ปกติ OpenLayers วัดตอนเฟรมแรก จึงบังคับวัดเลย
      map.updateSize();

      if (pins.length === 1) {
        map.getView().setCenter(fromLonLat([pins[0].lng, pins[0].lat]));
        map.getView().setZoom(15);
      } else if (pins.length > 1) {
        const extent = source.getExtent();
        if (extent) map.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 15 });
      }

      mapRef.current = map;
      overlayRef.current = overlay;
      setPopupBox(box);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.setTarget(undefined);
      mapRef.current?.dispose();
      mapRef.current = null;
      overlayRef.current = null;
      setPopupBox(null);
      setSelected(null);
    };
  }, [pins]);

  function closePopup() {
    overlayRef.current?.setPosition(undefined);
    setSelected(null);
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[60vh] min-h-80 w-full overflow-hidden rounded-2xl border border-line bg-raised"
      />

      {popupBox && selected
        ? createPortal(
            <div className="card w-52 p-3 text-left">
              <button
                type="button"
                onClick={closePopup}
                className="float-right -mt-1 px-1 text-muted hover:text-ink"
                aria-label="ปิด"
              >
                ×
              </button>
              <strong className="block pr-4 text-sm leading-snug">{selected.name}</strong>
              <span className="mt-0.5 block text-xs text-muted">
                ไป {selected.visitCount} ครั้ง · {formatScore(selected.averageScore)}/5
                {selected.category ? ` · ${selected.category}` : ""}
              </span>
              <Link
                href={`/restaurant/${selected.id}`}
                className="mt-2 block text-sm font-bold text-yolk-deep hover:underline"
              >
                ดูรายละเอียด
              </Link>
            </div>,
            popupBox,
          )
        : null}
    </div>
  );
}
