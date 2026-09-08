"use client";

import { useActionState, useState } from "react";

import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import { CUISINE_SUGGESTIONS, PRICE_LEVELS } from "@/lib/constants";
import { updateRestaurantAction } from "@/lib/actions/visits";
import { initialFormState } from "@/lib/form-state";
import type { RestaurantRow } from "@/lib/types";

export function RestaurantEditForm({ restaurant }: { restaurant: RestaurantRow }) {
  const [state, formAction, pending] = useActionState(
    updateRestaurantAction,
    initialFormState,
  );

  const [name, setName] = useState(restaurant.name);
  const [location, setLocation] = useState<LocationValue>({
    coords:
      restaurant.lat !== null && restaurant.lng !== null
        ? { lat: restaurant.lat, lng: restaurant.lng }
        : null,
    address: restaurant.address ?? "",
    googleUrl: restaurant.google_url ?? "",
  });

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="restaurant_id" value={restaurant.id} />

      <div>
        <label className="field-label" htmlFor="edit-name">
          ชื่อร้าน
        </label>
        <input
          id="edit-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field-input"
        />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="edit-category">
            ประเภทอาหาร
          </label>
          <input
            id="edit-category"
            name="category"
            list="cuisine-suggestions-edit"
            defaultValue={restaurant.category ?? ""}
            className="field-input"
          />
          <datalist id="cuisine-suggestions-edit">
            {CUISINE_SUGGESTIONS.map((cuisine) => (
              <option key={cuisine} value={cuisine} />
            ))}
          </datalist>
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
                  defaultChecked={restaurant.price_level === level.value}
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

      {state.status === "error" && state.message ? (
        <p className="field-error">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-leaf">{state.message}</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-secondary text-sm">
        {pending ? "กำลังบันทึก" : "บันทึกข้อมูลร้าน"}
      </button>
    </form>
  );
}
