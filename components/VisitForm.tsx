"use client";

import { useActionState, useState } from "react";

import { HeartRating } from "@/components/HeartRating";
import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import { AutoTextarea } from "@/components/ui/AutoTextarea";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Select, type SelectOption } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  CUISINE_SUGGESTIONS,
  PERSON_LABEL,
  PRICE_LEVELS,
  RATING_CATEGORIES,
  type Person,
} from "@/lib/constants";
import { createVisitAction } from "@/lib/actions/visits";
import { initialFormState } from "@/lib/form-state";

export type RestaurantOption = {
  id: string;
  name: string;
  category: string | null;
};

const EMPTY_LOCATION: LocationValue = { coords: null, address: "", googleUrl: "" };

export function VisitForm({
  restaurants,
  today,
  person,
}: {
  restaurants: RestaurantOption[];
  today: string;
  person: Person;
}) {
  const [state, formAction, pending] = useActionState(createVisitAction, initialFormState);

  const [mode, setMode] = useState<"new" | "existing">(
    restaurants.length > 0 ? "existing" : "new",
  );
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [visitedOn, setVisitedOn] = useState(today);
  const [location, setLocation] = useState<LocationValue>(EMPTY_LOCATION);

  const errors = state.errors ?? {};

  const restaurantOptions: SelectOption[] = restaurants.map((restaurant) => ({
    value: restaurant.id,
    label: restaurant.category
      ? `${restaurant.name} · ${restaurant.category}`
      : restaurant.name,
  }));

  const priceHint = PRICE_LEVELS.find((level) => level.value === priceLevel)?.hint;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />

      <section className="card rise p-4">
        <h2 className="mb-3 text-lg font-bold">ร้านไหน</h2>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={restaurants.length === 0}
            className={`btn text-sm ${mode === "existing" ? "btn-primary" : "btn-secondary"}`}
          >
            ร้านที่เคยไป
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`btn text-sm ${mode === "new" ? "btn-primary" : "btn-secondary"}`}
          >
            ร้านใหม่
          </button>
        </div>

        {/* สองฝั่งนี้สลับกันด้วยการ unmount ฝั่งเก่าแล้ว mount ฝั่งใหม่
            คลาส pop จึงเล่นเองทุกครั้งที่สลับ ไม่ต้องจัดการอะไรเพิ่ม */}
        {mode === "existing" ? (
          <div className="pop">
            <label className="field-label" htmlFor="restaurant_id">
              เลือกร้าน
            </label>
            <Select
              id="restaurant_id"
              name="restaurant_id"
              value={restaurantId}
              onChange={setRestaurantId}
              options={restaurantOptions}
              placeholder="เลือกร้านที่เคยไป"
              ariaLabel="เลือกร้าน"
            />
            {errors.restaurant_id ? (
              <p className="field-error">{errors.restaurant_id}</p>
            ) : null}
          </div>
        ) : (
          <div className="pop space-y-4">
            <div>
              <label className="field-label" htmlFor="name">
                ชื่อร้าน
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="เช่น ก๋วยเตี๋ยวเรือป้าแดง"
                className="field-input"
              />
              {errors.name ? <p className="field-error">{errors.name}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="category">
                  ประเภทอาหาร
                </label>
                <Combobox
                  id="category"
                  name="category"
                  value={category}
                  onChange={setCategory}
                  suggestions={CUISINE_SUGGESTIONS}
                  placeholder="เลือกหรือพิมพ์เอง"
                />
                {errors.category ? <p className="field-error">{errors.category}</p> : null}
              </div>

              <div>
                <span className="field-label">ระดับราคา</span>
                <div className="flex gap-2">
                  {PRICE_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className="flex-1 cursor-pointer rounded-xl border border-line bg-raised py-2 text-center text-sm transition-all duration-150 hover:border-yolk/50 has-[:checked]:border-yolk has-[:checked]:bg-yolk/20 has-[:checked]:font-bold has-[:checked]:text-yolk-deep has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-yolk"
                    >
                      <input
                        type="radio"
                        name="price_level"
                        value={level.value}
                        checked={priceLevel === level.value}
                        onChange={() => setPriceLevel(level.value)}
                        className="sr-only"
                      />
                      {level.label}
                    </label>
                  ))}
                </div>
                {/* คำอธิบายช่วงราคาเคยอยู่ใน title ซึ่งเป็น tooltip ของเบราว์เซอร์
                    ที่ต้องเอาเมาส์จ่อค้างไว้สองวินาที และบนมือถือไม่มีทางเห็นเลย */}
                <p className="mt-1.5 text-xs text-muted">
                  {priceHint ?? "แตะเพื่อเลือกราคาต่อคน"}
                </p>
              </div>
            </div>

            <LocationPicker
              value={location}
              onChange={setLocation}
              onSuggestName={(suggested) => setName((current) => current || suggested)}
              errors={errors}
            />
          </div>
        )}
      </section>

      <section className="card rise p-4">
        <h2 className="mb-3 text-lg font-bold">ไปกินวันไหน</h2>

        <div>
          <label className="field-label" htmlFor="visited_on">
            วันที่
          </label>
          <DatePicker
            id="visited_on"
            name="visited_on"
            value={visitedOn}
            onChange={setVisitedOn}
            today={today}
            max={today}
          />
          {errors.visited_on ? <p className="field-error">{errors.visited_on}</p> : null}
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="note">
            บันทึกของวันนั้น
          </label>
          <AutoTextarea
            id="note"
            name="note"
            placeholder="สั่งอะไรไปบ้าง ไปกับใคร มีอะไรน่าจำ"
          />
          {errors.note ? <p className="field-error">{errors.note}</p> : null}
        </div>
      </section>

      <section className="card rise p-4">
        <h2 className="text-lg font-bold">คะแนนของ{PERSON_LABEL[person]}</h2>
        <p className="mb-2 text-sm text-muted">
          อีกคนมาให้คะแนนของตัวเองทีหลังได้ที่หน้าบันทึกนี้
        </p>

        <div className="divide-y divide-line">
          {RATING_CATEGORIES.map((item) => (
            <HeartRating
              key={item.key}
              name={item.key}
              label={item.label}
              error={errors[item.key]}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="comment">
            ความเห็นเพิ่มเติม
          </label>
          <AutoTextarea
            id="comment"
            name="comment"
            placeholder="อร่อยตรงไหน ติดตรงไหน จะกลับไปอีกไหม"
          />
          {errors.comment ? <p className="field-error">{errors.comment}</p> : null}
        </div>
      </section>

      {state.status === "error" && state.message ? (
        <p className="rise rounded-2xl border border-heart/40 bg-heart/10 px-4 py-3 text-sm text-heart">
          {state.message}
        </p>
      ) : null}

      <SubmitButton pending={pending} pendingLabel="กำลังบันทึก" className="w-full py-3">
        บันทึกเลย
      </SubmitButton>

      <LoadingOverlay show={pending} message="กำลังบันทึก" />
    </form>
  );
}
