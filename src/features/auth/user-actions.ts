"use server";

import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { AdminAccessChangedEmail } from "@/emails/templates/admin-access-changed-email";
import { AdminEmailChangeConfirmationEmail } from "@/emails/templates/admin-email-change-confirmation-email";
import { AdminUserInviteEmail } from "@/emails/templates/admin-user-invite-email";
import { allPermissionKeys } from "@/features/auth/permissions";
import { requireAdminProfile } from "@/features/auth/queries";
import {
  deleteUserSchema,
  emailChangeSchema,
  inviteUserSchema,
  manageUserSchema,
  userIdSchema,
} from "@/features/auth/schema";
import { createOneTimeToken, expiresInHours } from "@/features/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import type { ActionState } from "@/lib/validations/action-state";

const INVITE_TTL_HOURS = 24;
const RESEND_COOLDOWN_MS = 60_000;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function permissionsFrom(formData: FormData) {
  const raw = formData.get("permissions");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string" && allPermissionKeys.includes(key as never)) : [];
  } catch {
    return [];
  }
}

function safeError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (/duplicate|already|registered|unique/i.test(message)) return "Já existe um usuário com este e-mail.";
  return fallback;
}

async function audit(input: {
  actorId: string;
  action: string;
  targetId?: string;
  targetEmail?: string;
  previous?: Record<string, Json | undefined>;
  next?: Record<string, Json | undefined>;
  metadata?: Record<string, Json | undefined>;
}) {
  const { error } = await createAdminClient().from("admin_audit_logs").insert({
    actor_profile_id: input.actorId,
    action: input.action,
    target_profile_id: input.targetId ?? null,
    target_email: input.targetEmail ?? null,
    previous_values: input.previous ?? {},
    new_values: input.next ?? {},
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

async function replacePermissionOverrides(profileId: string, allowedPermissions: string[], actorId: string) {
  const admin = createAdminClient();
  const { data: defaults, error: defaultsError } = await admin
    .from("role_permissions")
    .select("permission_key, allowed")
    .eq("role", "editor");
  if (defaultsError) throw defaultsError;

  const allowed = new Set(allowedPermissions);
  const defaultMap = new Map((defaults ?? []).map((item) => [item.permission_key, item.allowed]));
  const rows = allPermissionKeys
    .filter((key) => (defaultMap.get(key) ?? false) !== allowed.has(key))
    .map((permissionKey) => ({
      profile_id: profileId,
      permission_key: permissionKey,
      allowed: allowed.has(permissionKey),
      created_by: actorId,
    }));

  const { error: deleteError } = await admin.from("profile_permission_overrides").delete().eq("profile_id", profileId);
  if (deleteError) throw deleteError;
  if (rows.length) {
    const { error: insertError } = await admin.from("profile_permission_overrides").insert(rows);
    if (insertError) throw insertError;
  }
}

function invitationUrl(hashedToken: string, type: "invite" | "magiclink", attemptId: string) {
  const url = new URL("/admin/auth/confirm", siteUrl());
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", type);
  url.searchParams.set("attempt", attemptId);
  url.searchParams.set("next", "/admin/definir-senha");
  return url.toString();
}

async function deliverInvitation(input: {
  actorId: string;
  profileId: string;
  name: string;
  email: string;
  type: "invite" | "magiclink";
}) {
  const admin = createAdminClient();
  const attemptId = crypto.randomUUID();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: input.type,
    email: input.email,
    options: { data: { name: input.name }, redirectTo: `${siteUrl()}/admin/definir-senha` },
  });
  if (linkError || !linkData.properties.hashed_token) throw linkError ?? new Error("Link de convite indisponível.");

  await admin.from("user_invitation_attempts").update({
    status: "revoked",
    revoked_at: new Date().toISOString(),
  }).eq("profile_id", input.profileId).eq("status", "pending");

  const { error: attemptError } = await admin.from("user_invitation_attempts").insert({
    id: attemptId,
    profile_id: input.profileId,
    invited_by: input.actorId,
    expires_at: expiresInHours(INVITE_TTL_HOURS),
  });
  if (attemptError) throw attemptError;

  const delivery = await sendTransactionalEmail({
    templateKey: "admin_user_invite",
    to: input.email,
    subject: "Convite para o painel da Leehov Turismo",
    react: createElement(AdminUserInviteEmail, {
      name: input.name,
      inviteUrl: invitationUrl(linkData.properties.hashed_token, input.type, attemptId),
      expiresInHours: INVITE_TTL_HOURS,
    }),
    relatedEntityType: "user_invitation_attempt",
    relatedEntityId: attemptId,
    idempotencyKey: `admin-user-invite-${attemptId}`,
  });

  await admin.from("user_invitation_attempts").update({
    email_log_id: delivery.logId,
    status: delivery.status === "sent" ? "pending" : "failed",
    error_message: delivery.errorMessage ?? (delivery.status === "skipped" ? "Envio não configurado." : null),
  }).eq("id", attemptId);
  return delivery;
}

export async function inviteAdminUserAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = inviteUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    permissions: permissionsFrom(formData),
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados." };

  const admin = createAdminClient();
  const { data: duplicate } = await admin.from("profiles").select("id").ilike("email", parsed.data.email).maybeSingle();
  if (duplicate) return { success: false, message: "Já existe um usuário com este e-mail." };

  let createdUserId: string | null = null;
  try {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: parsed.data.email,
      options: { data: { name: parsed.data.name }, redirectTo: `${siteUrl()}/admin/definir-senha` },
    });
    if (linkError) throw linkError;
    createdUserId = linkData.user.id;
    const now = new Date().toISOString();
    const { error: profileError } = await admin.from("profiles").update({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      active: false,
      invited_by: actor.id,
      invited_at: now,
      accepted_at: null,
      suspended_at: null,
      suspended_by: null,
    }).eq("id", createdUserId);
    if (profileError) throw profileError;
    if (parsed.data.role === "editor") await replacePermissionOverrides(createdUserId, parsed.data.permissions, actor.id);

    const attemptId = crypto.randomUUID();
    const { error: attemptError } = await admin.from("user_invitation_attempts").insert({
      id: attemptId,
      profile_id: createdUserId,
      invited_by: actor.id,
      expires_at: expiresInHours(INVITE_TTL_HOURS),
    });
    if (attemptError) throw attemptError;
    const delivery = await sendTransactionalEmail({
      templateKey: "admin_user_invite",
      to: parsed.data.email,
      subject: "Convite para o painel da Leehov Turismo",
      react: createElement(AdminUserInviteEmail, {
        name: parsed.data.name,
        inviteUrl: invitationUrl(linkData.properties.hashed_token, "invite", attemptId),
        expiresInHours: INVITE_TTL_HOURS,
      }),
      relatedEntityType: "user_invitation_attempt",
      relatedEntityId: attemptId,
      idempotencyKey: `admin-user-invite-${attemptId}`,
    });
    await admin.from("user_invitation_attempts").update({
      email_log_id: delivery.logId,
      status: delivery.status === "sent" ? "pending" : "failed",
      error_message: delivery.errorMessage ?? (delivery.status === "skipped" ? "Envio não configurado." : null),
    }).eq("id", attemptId);
    await audit({ actorId: actor.id, action: "user.invited", targetId: createdUserId, targetEmail: parsed.data.email, next: { role: parsed.data.role, permissions: parsed.data.permissions } });
    revalidatePath("/admin/usuarios");
    return delivery.status === "sent"
      ? { success: true, message: "Convite enviado com sucesso." }
      : { success: false, message: "Usuário criado como pendente, mas o e-mail não foi enviado. Revise a configuração e reenvie." };
  } catch (error) {
    if (createdUserId) await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    return { success: false, message: safeError(error, "Não foi possível criar o convite.") };
  }
}

export async function resendInvitationAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, message: "Usuário inválido." };
  const admin = createAdminClient();
  const [{ data: profile }, { data: latest }] = await Promise.all([
    admin.from("profiles").select("id, name, email, accepted_at").eq("id", parsed.data.id).maybeSingle(),
    admin.from("user_invitation_attempts").select("created_at").eq("profile_id", parsed.data.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!profile || profile.accepted_at) return { success: false, message: "Este usuário não possui convite pendente." };
  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return { success: false, message: "Aguarde 60 segundos antes de reenviar." };
  }
  try {
    const delivery = await deliverInvitation({ actorId: actor.id, profileId: profile.id, name: profile.name || "viajante", email: profile.email, type: "magiclink" });
    await audit({ actorId: actor.id, action: "user.invitation_resent", targetId: profile.id, targetEmail: profile.email });
    revalidatePath("/admin/usuarios");
    return delivery.status === "sent" ? { success: true, message: "Novo convite enviado." } : { success: false, message: "O novo convite foi gerado, mas o e-mail não foi enviado." };
  } catch (error) {
    return { success: false, message: safeError(error, "Não foi possível reenviar o convite.") };
  }
}

export async function updateAdminUserAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = manageUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    permissions: permissionsFrom(formData),
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados." };
  if (parsed.data.id === actor.id && parsed.data.role !== "admin") return { success: false, message: "Você não pode remover o próprio papel de Admin." };
  const admin = createAdminClient();
  const { data: previous } = await admin.from("profiles").select("name, email, role").eq("id", parsed.data.id).maybeSingle();
  if (!previous) return { success: false, message: "Usuário não encontrado." };
  try {
    const { error } = await admin.from("profiles").update({ name: parsed.data.name, role: parsed.data.role }).eq("id", parsed.data.id);
    if (error) throw error;
    await admin.auth.admin.updateUserById(parsed.data.id, { user_metadata: { name: parsed.data.name } });
    if (parsed.data.role === "editor") await replacePermissionOverrides(parsed.data.id, parsed.data.permissions, actor.id);
    else await admin.from("profile_permission_overrides").delete().eq("profile_id", parsed.data.id);
    await audit({ actorId: actor.id, action: "user.updated", targetId: parsed.data.id, targetEmail: previous.email, previous: { name: previous.name, role: previous.role }, next: { name: parsed.data.name, role: parsed.data.role, permissions: parsed.data.role === "editor" ? parsed.data.permissions : [] } });
    await sendTransactionalEmail({
      templateKey: "admin_access_changed",
      to: previous.email,
      subject: "Seu acesso ao painel Leehov foi atualizado",
      react: createElement(AdminAccessChangedEmail, { name: parsed.data.name, role: parsed.data.role }),
      relatedEntityType: "profile",
      relatedEntityId: parsed.data.id,
      idempotencyKey: `admin-access-updated-${parsed.data.id}-${Date.now()}`,
    });
    revalidatePath("/admin/usuarios");
    return { success: true, message: "Usuário atualizado." };
  } catch (error) {
    return { success: false, message: safeError(error, "Não foi possível atualizar o usuário.") };
  }
}

export async function setUserSuspensionAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, message: "Usuário inválido." };
  const suspended = formData.get("suspended") === "true";
  if (parsed.data.id === actor.id && suspended) return { success: false, message: "Você não pode suspender a própria conta." };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("email, accepted_at, active").eq("id", parsed.data.id).maybeSingle();
  if (!profile) return { success: false, message: "Usuário não encontrado." };
  if (suspended && !profile.accepted_at) return { success: false, message: "Contas com convite pendente não podem ser suspensas." };
  if (!suspended && !profile.accepted_at) return { success: false, message: "Reenvie o convite para ativar uma conta ainda não aceita." };
  const { error } = await admin.from("profiles").update({
    active: !suspended,
    suspended_at: suspended ? new Date().toISOString() : null,
    suspended_by: suspended ? actor.id : null,
  }).eq("id", parsed.data.id);
  if (error) return { success: false, message: "Não foi possível alterar o estado da conta." };
  if (suspended) {
    const now = new Date().toISOString();
    await admin.from("user_email_change_requests").update({ revoked_at: now }).eq("profile_id", parsed.data.id).is("consumed_at", null).is("revoked_at", null);
  }
  await audit({ actorId: actor.id, action: suspended ? "user.suspended" : "user.reactivated", targetId: parsed.data.id, targetEmail: profile.email, previous: { active: profile.active }, next: { active: !suspended } });
  revalidatePath("/admin/usuarios");
  return { success: true, message: suspended ? "Usuário suspenso imediatamente." : "Usuário reativado." };
}

export async function resetUserMfaAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, message: "Usuário inválido." };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: parsed.data.id });
  if (error) return { success: false, message: "Não foi possível consultar o MFA." };
  for (const factor of data.factors) {
    const result = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: parsed.data.id });
    if (result.error) return { success: false, message: "Não foi possível remover todos os fatores de MFA." };
  }
  await audit({ actorId: actor.id, action: "user.mfa_reset", targetId: parsed.data.id, metadata: { factors_removed: data.factors.length } });
  revalidatePath("/admin/usuarios");
  return { success: true, message: data.factors.length ? "MFA removido e sessões revogadas." : "O usuário não tinha MFA cadastrado." };
}

export async function requestUserEmailChangeAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = emailChangeSchema.safeParse({ profileId: formData.get("id"), newEmail: formData.get("newEmail") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "E-mail inválido." };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("name, email, active").eq("id", parsed.data.profileId).maybeSingle();
  if (!profile) return { success: false, message: "Usuário não encontrado." };
  if (!profile.active) return { success: false, message: "Reative o usuário antes de alterar seu e-mail." };
  if (profile.email.toLowerCase() === parsed.data.newEmail) return { success: false, message: "O novo e-mail é igual ao atual." };
  const { data: duplicate } = await admin.from("profiles").select("id").ilike("email", parsed.data.newEmail).maybeSingle();
  if (duplicate) return { success: false, message: "Este e-mail já está em uso." };
  const { token, tokenHash } = createOneTimeToken();
  const requestId = crypto.randomUUID();
  await admin.from("user_email_change_requests").update({ revoked_at: new Date().toISOString() }).eq("profile_id", parsed.data.profileId).is("consumed_at", null).is("revoked_at", null);
  const { error } = await admin.from("user_email_change_requests").insert({
    id: requestId,
    profile_id: parsed.data.profileId,
    requested_by: actor.id,
    old_email: profile.email,
    new_email: parsed.data.newEmail,
    token_hash: tokenHash,
    expires_at: expiresInHours(24),
  });
  if (error) return { success: false, message: "Não foi possível iniciar a troca de e-mail." };
  const confirmationUrl = `${siteUrl()}/admin/email/confirmar?token=${encodeURIComponent(token)}`;
  const delivery = await sendTransactionalEmail({
    templateKey: "admin_email_change_confirmation",
    to: parsed.data.newEmail,
    subject: "Confirme seu novo e-mail na Leehov",
    react: createElement(AdminEmailChangeConfirmationEmail, { name: profile.name || "viajante", confirmationUrl }),
    relatedEntityType: "user_email_change_request",
    relatedEntityId: requestId,
    idempotencyKey: `admin-email-change-${requestId}`,
  });
  await audit({ actorId: actor.id, action: "user.email_change_requested", targetId: parsed.data.profileId, targetEmail: profile.email, next: { new_email: parsed.data.newEmail } });
  return delivery.status === "sent" ? { success: true, message: "Confirmação enviada ao novo endereço." } : { success: false, message: "Solicitação criada, mas o e-mail não foi enviado." };
}

export async function deleteAdminUserAction(formData: FormData): Promise<ActionState> {
  const actor = await requireAdminProfile();
  const parsed = deleteUserSchema.safeParse({ id: formData.get("id"), confirmationEmail: formData.get("confirmationEmail") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Confirmação inválida." };
  if (parsed.data.id === actor.id) return { success: false, message: "Você não pode excluir a própria conta." };
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("name, email, role, active, suspended_at").eq("id", parsed.data.id).maybeSingle();
  if (!profile) return { success: false, message: "Usuário não encontrado." };
  if (profile.email.toLowerCase() !== parsed.data.confirmationEmail) return { success: false, message: "O e-mail de confirmação não corresponde." };
  if (profile.active || !profile.suspended_at) return { success: false, message: "Suspenda o usuário antes da exclusão permanente." };

  const { data: ownership, error: preflightError } = await admin.rpc("admin_user_delete_preflight", { target_profile_id: parsed.data.id });
  if (preflightError) return { success: false, message: "Não foi possível concluir o preflight de vínculos e arquivos." };
  await admin.from("user_invitation_attempts").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("profile_id", parsed.data.id).eq("status", "pending");
  await admin.from("user_email_change_requests").update({ revoked_at: new Date().toISOString() }).eq("profile_id", parsed.data.id).is("consumed_at", null).is("revoked_at", null);
  await audit({ actorId: actor.id, action: "user.deleted", targetId: parsed.data.id, targetEmail: profile.email, previous: { name: profile.name, role: profile.role, active: profile.active }, metadata: { ownership } });
  const { error } = await admin.auth.admin.deleteUser(parsed.data.id, false);
  if (error) return { success: false, message: "A exclusão falhou. A conta permanece suspensa com segurança." };
  revalidatePath("/admin/usuarios");
  return { success: true, message: "Usuário excluído permanentemente. A autoria histórica foi preservada." };
}
