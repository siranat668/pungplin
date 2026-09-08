"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "../db";
import { formError, type FormState } from "../form-state";
import { requirePerson } from "../identity";
import { allowRequest } from "../ratelimit";
import {
  createVisitSchema,
  fieldErrors,
  formDataToObject,
  idSchema,
  updateRestaurantSchema,
  updateVisitSchema,
  upsertRatingSchema,
} from "../schemas";

const RATE_LIMITED = "บันทึกถี่เกินไป พักสักครู่แล้วลองใหม่";
const GENERIC_ERROR = "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง";

function refreshEverything(restaurantId?: string) {
  revalidatePath("/feed");
  revalidatePath("/map");
  if (restaurantId) revalidatePath(`/restaurant/${restaurantId}`);
}

export async function createVisitAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const person = await requirePerson();

  if (!(await allowRequest("write"))) return formError(RATE_LIMITED);

  const parsed = createVisitSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return formError("ยังกรอกไม่ครบ ดูช่องที่ขึ้นสีแดง", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  let restaurantId: string;

  if (input.mode === "existing") {
    const { data: restaurant, error } = await db()
      .from("restaurants")
      .select("id")
      .eq("id", input.restaurant_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) return formError(GENERIC_ERROR);
    if (!restaurant) {
      return formError("ไม่พบร้านที่เลือก อาจถูกลบไปแล้ว", {
        restaurant_id: "เลือกร้านใหม่อีกครั้ง",
      });
    }
    restaurantId = restaurant.id;
  } else {
    const { data: created, error } = await db()
      .from("restaurants")
      .insert({
        name: input.name,
        address: input.address,
        category: input.category,
        lat: input.lat,
        lng: input.lng,
        google_url: input.google_url,
        price_level: input.price_level,
        created_by: person,
      })
      .select("id")
      .single();

    if (error || !created) return formError(GENERIC_ERROR);
    restaurantId = created.id;
  }

  const { data: visit, error: visitError } = await db()
    .from("visits")
    .insert({
      restaurant_id: restaurantId,
      visited_on: input.visited_on,
      note: input.note,
      created_by: person,
    })
    .select("id")
    .single();

  if (visitError || !visit) return formError(GENERIC_ERROR);

  const { error: ratingError } = await db().from("ratings").insert({
    visit_id: visit.id,
    reviewer: person,
    taste: input.taste,
    value: input.value,
    ambience: input.ambience,
    service: input.service,
    cleanliness: input.cleanliness,
    comment: input.comment,
  });

  if (ratingError) return formError(GENERIC_ERROR);

  refreshEverything(restaurantId);
  // redirect โยน exception ที่ Next ดักเอง ต้องอยู่นอก try/catch เสมอ
  redirect(`/visit/${visit.id}`);
}

/** ให้คะแนนหรือแก้คะแนนของคนที่กำลังใช้งานอยู่ ต่อบันทึกหนึ่งครั้ง */
export async function upsertRatingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const person = await requirePerson();

  if (!(await allowRequest("write"))) return formError(RATE_LIMITED);

  const parsed = upsertRatingSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return formError("ยังกรอกไม่ครบ ดูช่องที่ขึ้นสีแดง", fieldErrors(parsed.error));
  }

  const input = parsed.data;

  const { error } = await db()
    .from("ratings")
    .upsert(
      {
        visit_id: input.visit_id,
        reviewer: person,
        taste: input.taste,
        value: input.value,
        ambience: input.ambience,
        service: input.service,
        cleanliness: input.cleanliness,
        comment: input.comment,
      },
      { onConflict: "visit_id,reviewer" },
    );

  if (error) return formError(GENERIC_ERROR);

  revalidatePath(`/visit/${input.visit_id}`);
  refreshEverything();
  return { status: "success", message: "บันทึกคะแนนแล้ว" };
}

export async function updateVisitAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePerson();

  if (!(await allowRequest("write"))) return formError(RATE_LIMITED);

  const parsed = updateVisitSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return formError("ยังกรอกไม่ครบ ดูช่องที่ขึ้นสีแดง", fieldErrors(parsed.error));
  }

  const input = parsed.data;

  const { error } = await db()
    .from("visits")
    .update({ visited_on: input.visited_on, note: input.note })
    .eq("id", input.visit_id)
    .is("deleted_at", null);

  if (error) return formError(GENERIC_ERROR);

  revalidatePath(`/visit/${input.visit_id}`);
  refreshEverything();
  return { status: "success", message: "แก้ไขแล้ว" };
}

export async function updateRestaurantAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePerson();

  if (!(await allowRequest("write"))) return formError(RATE_LIMITED);

  const parsed = updateRestaurantSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return formError("ยังกรอกไม่ครบ ดูช่องที่ขึ้นสีแดง", fieldErrors(parsed.error));
  }

  const input = parsed.data;

  const { error } = await db()
    .from("restaurants")
    .update({
      name: input.name,
      address: input.address,
      category: input.category,
      lat: input.lat,
      lng: input.lng,
      google_url: input.google_url,
      price_level: input.price_level,
    })
    .eq("id", input.restaurant_id)
    .is("deleted_at", null);

  if (error) return formError(GENERIC_ERROR);

  refreshEverything(input.restaurant_id);
  return { status: "success", message: "แก้ไขข้อมูลร้านแล้ว" };
}

/**
 * ลบแบบ soft delete ทั้งหมด แถวยังอยู่ในฐานข้อมูล แค่ติดธง deleted_at
 * เพราะแอพนี้เปิดให้ใครก็เข้ามากดได้ และ Supabase free tier ไม่มี backup อัตโนมัติ
 * กู้คืนได้ด้วย: update visits set deleted_at = null where id = '...';
 */
export async function deleteVisitAction(formData: FormData): Promise<void> {
  await requirePerson();

  const parsed = idSchema.safeParse({ id: formData.get("visit_id") });
  if (!parsed.success) redirect("/feed");

  await db()
    .from("visits")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  refreshEverything();
  redirect("/feed");
}

export async function deleteRestaurantAction(formData: FormData): Promise<void> {
  await requirePerson();

  const parsed = idSchema.safeParse({ id: formData.get("restaurant_id") });
  if (!parsed.success) redirect("/feed");

  const now = new Date().toISOString();
  await db().from("restaurants").update({ deleted_at: now }).eq("id", parsed.data.id);
  await db().from("visits").update({ deleted_at: now }).eq("restaurant_id", parsed.data.id);

  refreshEverything(parsed.data.id);
  redirect("/feed");
}
