"use server";

import { createElement } from "react";
import { redirect } from "next/navigation";
import { AdminPasswordRecoveryEmail } from "@/emails/templates/admin-password-recovery-email";
import { firstAllowedAdminPath, getEffectivePermissions } from "@/features/auth/permissions";
import { recoverySchema, setPasswordSchema } from "@/features/auth/schema";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validations/action-state";
import { isPendingOneTimeUse } from "@/features/auth/one-time-state";

const GENERIC_RECOVERY_MESSAGE = "Se existir uma conta ativa para este e-mail, enviaremos as instruções de recuperação.";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function requestPasswordRecoveryAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: true, message: GENERIC_RECOVERY_MESSAGE };
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, email, active, accepted_at")
    .ilike("email", parsed.data.email)
    .maybeSingle();
  if (!profile?.active || !profile.accepted_at) return { success: true, message: GENERIC_RECOVERY_MESSAGE };

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: profile.email,
    options: { redirectTo: `${siteUrl()}/admin/definir-senha` },
  });
  if (!error && data.properties.hashed_token) {
    const callback = new URL("/admin/auth/confirm", siteUrl());
    callback.searchParams.set("token_hash", data.properties.hashed_token);
    callback.searchParams.set("type", "recovery");
    callback.searchParams.set("next", "/admin/definir-senha");
    await sendTransactionalEmail({
      templateKey: "admin_password_recovery",
      to: profile.email,
      subject: "Redefina sua senha do painel Leehov",
      react: createElement(AdminPasswordRecoveryEmail, { name: profile.name || "viajante", recoveryUrl: callback.toString() }),
      relatedEntityType: "profile",
      relatedEntityId: profile.id,
      idempotencyKey: `admin-password-recovery-${profile.id}-${crypto.randomUUID()}`,
    });
  }
  return { success: true, message: GENERIC_RECOVERY_MESSAGE };
}

export async function setPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setPasswordSchema.safeParse({ password: formData.get("password"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise a senha." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { success: false, message: "O link não é mais válido. Solicite um novo." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, name, email, role, active, accepted_at, invited_at").eq("id", userId).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, message: "Perfil administrativo não encontrado." };
  }

  const attemptId = formData.get("attempt");
  const acceptingInvitation = !profile.accepted_at && Boolean(profile.invited_at);
  let validAttemptId: string | null = null;
  if (!profile.accepted_at && profile.invited_at) {
    if (typeof attemptId !== "string") return { success: false, message: "Convite inválido. Solicite um novo envio." };
    const { data: attempt } = await admin.from("user_invitation_attempts")
      .select("id, status, expires_at")
      .eq("id", attemptId)
      .eq("profile_id", userId)
      .maybeSingle();
    if (!attempt || !isPendingOneTimeUse({ expiresAt: attempt.expires_at, status: attempt.status })) {
      return { success: false, message: "Este convite expirou ou já foi utilizado." };
    }
    validAttemptId = attempt.id;
  } else if (!profile.active) {
    await supabase.auth.signOut();
    return { success: false, message: "A conta está suspensa. Fale com o administrador geral." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (passwordError) return { success: false, message: "Não foi possível atualizar a senha. Solicite um novo link." };

  if (acceptingInvitation && validAttemptId) {
    const now = new Date().toISOString();
    const { error: activationError } = await admin.from("profiles").update({ active: true, accepted_at: now, suspended_at: null, suspended_by: null }).eq("id", userId);
    if (activationError) return { success: false, message: "A senha foi definida, mas não foi possível ativar o acesso." };
    await admin.from("user_invitation_attempts").update({ status: "accepted", accepted_at: now }).eq("id", validAttemptId).eq("status", "pending");
    profile.active = true;
  }
  if (!profile.active) {
    await supabase.auth.signOut();
    return { success: false, message: "A conta está suspensa. Fale com o administrador geral." };
  }
  await admin.from("admin_audit_logs").insert({
    actor_profile_id: userId,
    action: acceptingInvitation ? "user.invitation_accepted" : "user.password_reset",
    target_profile_id: userId,
    target_email: profile.email,
  });
  const permissions = await getEffectivePermissions(userId, profile.role, true);
  redirect(firstAllowedAdminPath(permissions));
}

export async function changeOwnPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setPasswordSchema.safeParse({ password: formData.get("password"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise a senha." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  return error ? { success: false, message: "Não foi possível alterar a senha." } : { success: true, message: "Senha alterada com sucesso." };
}
