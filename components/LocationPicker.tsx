"use client";

import { useState } from "react";

import { MapPicker, type Coords } from "@/components/MapPicker";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

type GeocodePlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type LocationValue = {
  coords: Coords | null;
  address: string;
  googleUrl: string;
};

export function LocationPicker({
  value,
  onChange,
  onSuggestName,
  errors,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  onSuggestName?: (name: string) => void;
  errors?: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodePlace[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkNote, setLinkNote] = useState<string | null>(null);

  async function runSearch() {
    const term = query.trim();
    if (term.length < 3) {
      setSearchError("พิมพ์อย่างน้อย 3 ตัวอักษร");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      if (!response.ok) {
        setSearchError(data.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      setResults(data.places as GeocodePlace[]);
      if ((data.places as GeocodePlace[]).length === 0) {
        setSearchError("ไม่เจอที่นี่ ลองพิมพ์ชื่อถนนหรือย่านเพิ่ม หรือปักหมุดเองด้านล่าง");
      }
    } catch {
      setSearchError("ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(place: GeocodePlace) {
    onChange({
      ...value,
      coords: { lat: place.lat, lng: place.lng },
      address: place.address,
    });
    onSuggestName?.(place.name);
    setResults(null);
    setQuery("");
  }

  async function resolveGoogleLink() {
    const url = value.googleUrl.trim();
    if (!url) {
      setLinkError("วางลิงก์ก่อน");
      return;
    }

    setResolving(true);
    setLinkError(null);
    setLinkNote(null);

    try {
      const response = await fetch("/api/resolve-google", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLinkError(data.error ?? "แกะลิงก์ไม่สำเร็จ");
        return;
      }

      const place = data.place as {
        lat: number;
        lng: number;
        name: string | null;
        address: string | null;
      };

      // ที่อยู่ที่พิมพ์เองไว้แล้วสำคัญกว่าที่ระบบเดาให้ เลยเติมเฉพาะตอนช่องยังว่าง
      const filledAddress = !value.address.trim() && place.address ? place.address : null;

      onChange({
        ...value,
        coords: { lat: place.lat, lng: place.lng },
        address: filledAddress ?? value.address,
      });
      if (place.name) onSuggestName?.(place.name);

      setLinkNote(
        [
          place.name ? `เจอชื่อร้าน ${place.name}` : "เจอพิกัดแล้ว ดูหมุดบนแผนที่ด้านล่าง",
          filledAddress ? "เติมที่อยู่ให้แล้ว แก้ได้" : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    } catch {
      setLinkError("แกะลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ส่งขึ้น server เป็นค่าตัวเลขล้วน ไม่ได้ส่งสถานะ UI อะไรไปด้วย */}
      <input type="hidden" name="lat" value={value.coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={value.coords?.lng ?? ""} />

      {/* ลิงก์ Google เป็นทางหลัก เพราะเป็นสิ่งที่คนกดแชร์มาจากมือถืออยู่แล้ว
          และแกะได้ทั้งพิกัด ชื่อร้าน และที่อยู่ในทีเดียว */}
      <div>
        <label className="field-label" htmlFor="google_url">
          วางลิงก์จาก Google Maps
        </label>
        <div className="flex gap-2">
          <input
            id="google_url"
            name="google_url"
            type="url"
            inputMode="url"
            value={value.googleUrl}
            onChange={(event) => onChange({ ...value, googleUrl: event.target.value })}
            placeholder="https://maps.app.goo.gl/..."
            className="field-input"
          />
          <button
            type="button"
            onClick={() => void resolveGoogleLink()}
            disabled={resolving}
            className="btn btn-secondary shrink-0"
          >
            {resolving ? <Spinner size={16} /> : null}
            {resolving ? "กำลังแกะ" : "แกะข้อมูล"}
          </button>
        </div>

        {/* การแกะลิงก์ต้องวิ่งไปถาม Google แล้วต่อด้วย Nominatim อีกทอด
            นานพอที่จะต้องมีกล่องบอกว่าระบบยังทำงานอยู่ ไม่ใช่ค้าง */}
        <LoadingOverlay show={resolving} message="กำลังแกะลิงก์" />
        <p className="mt-1 text-xs text-muted">
          กดแชร์ในแอพ Google Maps แล้วคัดลอกลิงก์มาวาง ระบบจะแกะพิกัด ชื่อร้าน และที่อยู่ให้เอง
        </p>
        {errors?.google_url ? <p className="field-error">{errors.google_url}</p> : null}
        {linkError ? <p className="field-error">{linkError}</p> : null}
        {linkNote ? <p className="mt-1 text-sm text-leaf">{linkNote}</p> : null}
      </div>

      <div>
        <label className="field-label" htmlFor="place-search">
          หรือค้นหาชื่อร้านเอง
        </label>
        <div className="flex gap-2">
          <input
            id="place-search"
            /* ไม่ใช้ type="search" เพราะ WebKit เติมปุ่มกากบาทล้างช่องเข้ามาให้เอง
               ซึ่งเบราว์เซอร์อื่นไม่มี ทำให้ช่องเดียวกันหน้าตาไม่เท่ากันแต่ละเครื่อง */
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                // กัน Enter ในช่องค้นหาไปกด submit ทั้งฟอร์ม
                event.preventDefault();
                void runSearch();
              }
            }}
            placeholder="เช่น ร้านลุงหนวด บางแสน"
            className="field-input"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching}
            className="btn btn-secondary shrink-0"
          >
            {searching ? <Spinner size={16} /> : null}
            {searching ? "กำลังค้น" : "ค้นหา"}
          </button>
        </div>
        {searchError ? <p className="field-error">{searchError}</p> : null}

        {/* ผลค้นหาโผล่ตรงนี้ ระหว่างรอจึงวางโครงร่างไว้ที่เดิมแทนกล่องกลางจอ
            พอผลจริงมาแทนที่ ของก็อยู่ตำแหน่งเดิม หน้าไม่กระตุกขึ้นลง */}
        {searching ? (
          <div className="fade mt-2 space-y-px overflow-hidden rounded-2xl border border-line">
            {[0, 1, 2].map((row) => (
              <div key={row} className="space-y-1.5 bg-raised px-3 py-2.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-2.5 w-4/5" />
              </div>
            ))}
          </div>
        ) : null}

        {!searching && results && results.length > 0 ? (
          <ul className="stagger mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {results.map((place) => (
              <li key={`${place.lat},${place.lng}`}>
                <button
                  type="button"
                  onClick={() => pickResult(place)}
                  className="block w-full bg-raised px-3 py-2 text-left transition-colors duration-150 hover:bg-surface"
                >
                  <span className="block text-sm font-semibold">{place.name}</span>
                  <span className="block text-xs text-muted">{place.address}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <MapPicker
        value={value.coords}
        onChange={(coords) => onChange({ ...value, coords })}
      />

      <p className="text-xs text-muted">
        {value.coords
          ? `หมุดอยู่ที่ ${value.coords.lat.toFixed(5)}, ${value.coords.lng.toFixed(5)}`
          : "ยังไม่ได้ปักหมุด ร้านนี้จะไม่ขึ้นบนหน้าแผนที่จนกว่าจะปัก"}
      </p>

      <div>
        <label className="field-label" htmlFor="address">
          ที่อยู่
        </label>
        <input
          id="address"
          name="address"
          value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
          placeholder="ใส่เองหรือปล่อยให้ระบบเติมจากผลค้นหา"
          className="field-input"
        />
        {errors?.address ? <p className="field-error">{errors.address}</p> : null}
      </div>
    </div>
  );
}
