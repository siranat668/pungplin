"use client";

import { useActionState, useState } from "react";

import { HeartRating } from "@/components/HeartRating";
import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
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
  const [location, setLocation] = useState<LocationValue>(EMPTY_LOCATION);

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />

      <section className="card p-4">
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

        {mode === "existing" ? (
          <div>
            <label className="field-label" htmlFor="restaurant_id">
              เลือกร้าน
            </label>
            <select
              id="restaurant_id"
              name="restaurant_id"
              value={restaurantId}
              onChange={(event) => setRestaurantId(event.target.value)}
              className="field-input"
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                  {restaurant.category ? ` · ${restaurant.category}` : ""}
                </option>
              ))}
            </select>
            {errors.restaurant_id ? (
              <p className="field-error">{errors.restaurant_id}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
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
                <input
                  id="category"
                  name="category"
                  list="cuisine-suggestions"
                  placeholder="เลือกหรือพิมพ์เอง"
                  className="field-input"
                />
                <datalist id="cuisine-suggestions">
                  {CUISINE_SUGGESTIONS.map((cuisine) => (
                    <option key={cuisine} value={cuisine} />
                  ))}
                </datalist>
                {errors.category ? <p className="field-error">{errors.category}</p> : null}
              </div>

              <div>
                <span className="field-label">ระดับราคา</span>
                <div className="flex gap-2">
                  {PRICE_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      title={level.hint}
                      className="flex-1 cursor-pointer rounded-xl border border-line bg-raised py-2 text-center text-sm has-[:checked]:border-yolk has-[:checked]:bg-yolk/20 has-[:checked]:font-bold has-[:checked]:text-yolk-deep has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-yolk"
                    >
                      <input
                        type="radio"
                        name="price_level"
                        value={level.value}
                        className="sr-only"
                      />
                      {level.label}
                    </label>
                  ))}
                </div>
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

      <section className="card p-4">
        <h2 className="mb-3 text-lg font-bold">ไปกินวันไหน</h2>

        <div>
          <label className="field-label" htmlFor="visited_on">
            วันที่
          </label>
          <input
            id="visited_on"
            name="visited_on"
            type="date"
            defaultValue={today}
            max={today}
            className="field-input"
          />
          {errors.visited_on ? <p className="field-error">{errors.visited_on}</p> : null}
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="note">
            บันทึกของวันนั้น
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="สั่งอะไรไปบ้าง ไปกับใคร มีอะไรน่าจำ"
            className="field-input resize-y"
          />
          {errors.note ? <p className="field-error">{errors.note}</p> : null}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-bold">คะแนนของ{PERSON_LABEL[person]}</h2>
        <p className="mb-2 text-sm text-muted">
          อีกคนมาให้คะแนนของตัวเองทีหลังได้ที่หน้าบันทึกนี้
        </p>

        <div className="divide-y divide-line">
          {RATING_CATEGORIES.map((category) => (
            <HeartRating
              key={category.key}
              name={category.key}
              label={category.label}
              error={errors[category.key]}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="field-label" htmlFor="comment">
            ความเห็นเพิ่มเติม
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            placeholder="อร่อยตรงไหน ติดตรงไหน จะกลับไปอีกไหม"
            className="field-input resize-y"
          />
          {errors.comment ? <p className="field-error">{errors.comment}</p> : null}
        </div>
      </section>

      {state.status === "error" && state.message ? (
        <p className="rounded-2xl border border-heart/40 bg-heart/10 px-4 py-3 text-sm text-heart">
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-3">
        {pending ? "กำลังบันทึก" : "บันทึกเลย"}
      </button>
    </form>
  );
}
