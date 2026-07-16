"use server";

import { caravanInterestSchema } from "@/features/caravans/schema";

export async function createCaravanInterestAction(formData: FormData) {
  const parsed = caravanInterestSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    state: formData.get("state"),
    message: formData.get("message"),
    caravanId: formData.get("caravanId"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados informados antes de enviar.",
    };
  }

  return {
    success: false,
    message:
      "O formulario ja esta validado. A persistencia no Supabase entra na fase de leads.",
  };
}
