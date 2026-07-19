"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginSchema, updateProfileSchema } from "@/features/auth/schema";
import { requireAdminProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validations/action-state";

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

  if (signInError) {
    return { success: false, message: "E-mail ou senha inválidos." };
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    await supabase.auth.signOut();
    return { success: false, message: "Não foi possível validar a sessão." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, message: "Perfil administrativo não encontrado." };
  }

  if (!profile.active) {
    await supabase.auth.signOut();
    return { success: false, message: "Seu acesso ainda não foi aprovado pelo administrador geral." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateProfileAction(formData: FormData) {
  await requireAdminProfile();
  const parsed = updateProfileSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
    active: formData.get("active") === "true",
  });

  if (!parsed.success) {
    redirect("/admin/usuarios?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role, active: parsed.data.active })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?updated=1");
}
