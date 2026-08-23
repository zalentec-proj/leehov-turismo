"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/features/auth/schema";
import { firstAllowedAdminPath, getEffectivePermissions } from "@/features/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/public-forms";
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

  if (!await consumeRateLimit("login", 5, 900)) {
    return { success: false, message: "Muitas tentativas de acesso. Aguarde 15 minutos e tente novamente." };
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

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/admin/mfa/verificar");
  const permissions = await getEffectivePermissions(userId, profile.role, profile.active);
  redirect(firstAllowedAdminPath(permissions));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
