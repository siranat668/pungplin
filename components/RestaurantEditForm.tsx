"use client";

import { useActionState, useState } from "react";

import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import { Combobox } from "@/components/ui/Combobox";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { SubmitButton } from "@/components/ui/SubmitButton";
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
  const [category, setCategory] = useState(restaurant.category ?? "");
  const [priceLevel, setPriceLevel] = useState<number | null>(restaurant.price_level);
  const [location, setLocation] = useState<LocationValue>({
    coords:
      restaurant.lat !== null && restaurant.lng !== null
        ? { lat: restaurant.lat, lng: restaurant.lng }
        : null,
    address: restaurant.address ?? "",
    googleUrl: restaurant.google_url ?? "",
  });

  const errors = state.errors ?? {};
  const priceHint = PRICE_LEVELS.find((level) => level.value === priceLevel)?.hint;

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
          <Combobox
            id="edit-category"
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

      {state.status === "error" && state.message ? (
        <p className="field-error">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="fade text-sm text-leaf">{state.message}</p>
      ) : null}

      <SubmitButton
        variant="secondary"
        pending={pending}
        pendingLabel="กำลังบันทึก"
        className="text-sm"
      >
        บันทึกข้อมูลร้าน
      </SubmitButton>

      <LoadingOverlay show={pending} message="กำลังบันทึก" />
    </form>
  );
}
