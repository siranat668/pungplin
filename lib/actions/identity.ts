"use server";

import { redirect } from "next/navigation";

import { clearPersonCookie, setPersonCookie } from "../identity";
import { personSchema } from "../schemas";

export async function choosePerson(formData: FormData): Promise<void> {
  const parsed = personSchema.safeParse(formData.get("person"));
  if (!parsed.success) redirect("/");

  await setPersonCookie(parsed.data);

  const next = formData.get("next");
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/feed";

  redirect(safeNext);
}

export async function switchPerson(): Promise<void> {
  await clearPersonCookie();
  redirect("/");
}
