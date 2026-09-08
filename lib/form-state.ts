export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** ข้อความ error รายช่อง คีย์คือชื่อ field ใน form */
  errors?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

export function formError(message: string, errors?: Record<string, string>): FormState {
  return { status: "error", message, errors };
}
