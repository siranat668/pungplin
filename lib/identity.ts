import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isPerson, type Person } from "./constants";

export const IDENTITY_COOKIE = "pungplin_who";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * คุกกี้นี้บอกแค่ว่าคนหน้าจอตอนนี้คือมุกหรือเบย์ เอาไว้ติดป้ายเจ้าของบันทึก
 * มันไม่ใช่ระบบความปลอดภัย เพราะแอพเปิดให้ใครก็เข้าได้ตามที่ตกลงกันไว้
 * ถ้าวันไหนอยากกันคนนอกจริงๆ ให้เพิ่ม proxy.ts ตรวจ passcode ที่ขอบแอพ
 */
export async function getPerson(): Promise<Person | null> {
  const store = await cookies();
  const raw = store.get(IDENTITY_COOKIE)?.value;
  return isPerson(raw) ? raw : null;
}

export async function requirePerson(): Promise<Person> {
  const person = await getPerson();
  if (!person) redirect("/");
  return person;
}

export async function setPersonCookie(person: Person): Promise<void> {
  const store = await cookies();
  store.set(IDENTITY_COOKIE, person, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

export async function clearPersonCookie(): Promise<void> {
  const store = await cookies();
  store.delete(IDENTITY_COOKIE);
}
