import type { ReactNode } from "react";

import { Header } from "@/components/Header";
import { requirePerson } from "@/lib/identity";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // ยังไม่ได้เลือกว่าเป็นมุกหรือเบย์ ก็เด้งกลับไปหน้าเลือกก่อน
  const person = await requirePerson();

  return (
    <>
      <Header person={person} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6">{children}</main>
    </>
  );
}
