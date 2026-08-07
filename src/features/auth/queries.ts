import "server-only";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminProfile, AdminUser } from "@/features/auth/types";

export async function getCurrentProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, active, invited_at, accepted_at, suspended_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function requireActiveProfile(): Promise<AdminProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/admin/login?error=session");
  }

  if (!profile.active) {
    redirect("/admin/login?error=inactive");
  }

  await requireMfaAssurance();

  return profile;
}

export async function requireMfaAssurance() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") redirect("/admin/mfa/verificar");
}

export async function requireAdminProfile(): Promise<AdminProfile> {
  const profile = await requireActiveProfile();

  if (profile.role !== "admin") {
    redirect("/admin?error=forbidden");
  }

  return profile;
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  await requireAdminProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, active, invited_at, accepted_at, suspended_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os usuários administrativos.");
  }

  return data;
}

export async function getEditorDefaultPermissions(): Promise<string[]> {
  await requireAdminProfile();
  const { data, error } = await createAdminClient()
    .from("role_permissions")
    .select("permission_key")
    .eq("role", "editor")
    .eq("allowed", true);
  if (error) throw new Error("Não foi possível carregar o perfil padrão do Editor.");
  return (data ?? []).map((item) => item.permission_key);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireAdminProfile();
  const admin = createAdminClient();
  const [profilesResult, overridesResult, defaultsResult, invitationsResult, authUsersResult] = await Promise.all([
    admin.from("profiles").select("id, name, email, role, active, invited_at, accepted_at, suspended_at, created_at").order("created_at"),
    admin.from("profile_permission_overrides").select("profile_id, permission_key, allowed"),
    admin.from("role_permissions").select("permission_key, allowed").eq("role", "editor"),
    admin.from("user_invitation_attempts").select("profile_id, status, expires_at, created_at, email_log_id").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesResult.error || overridesResult.error || defaultsResult.error || invitationsResult.error || authUsersResult.error) {
    throw new Error("Não foi possível carregar os usuários administrativos.");
  }

  const authUsers = new Map(authUsersResult.data.users.map((user) => [user.id, user]));
  const defaults = new Set((defaultsResult.data ?? []).filter((item) => item.allowed).map((item) => item.permission_key));
  const overridesByProfile = new Map<string, Record<string, boolean>>();
  for (const override of overridesResult.data ?? []) {
    const current = overridesByProfile.get(override.profile_id) ?? {};
    current[override.permission_key] = override.allowed;
    overridesByProfile.set(override.profile_id, current);
  }
  const invitationsByProfile = new Map<string, (typeof invitationsResult.data)[number]>();
  for (const invitation of invitationsResult.data ?? []) {
    if (!invitationsByProfile.has(invitation.profile_id)) invitationsByProfile.set(invitation.profile_id, invitation);
  }
  const emailLogIds = [...invitationsByProfile.values()].map((item) => item.email_log_id).filter((id): id is string => Boolean(id));
  const { data: emailLogs } = emailLogIds.length
    ? await admin.from("email_logs").select("id, status").in("id", emailLogIds)
    : { data: [] };
  const emailStatusById = new Map((emailLogs ?? []).map((item) => [item.id, item.status]));

  return Promise.all((profilesResult.data ?? []).map(async (profile) => {
    const authUser = authUsers.get(profile.id);
    const overrides = overridesByProfile.get(profile.id) ?? {};
    const permissions = profile.role === "admin"
      ? []
      : [...defaults].filter((key) => overrides[key] !== false).concat(
          Object.entries(overrides).filter(([key, allowed]) => allowed && !defaults.has(key)).map(([key]) => key),
        );
    const invitation = invitationsByProfile.get(profile.id);
    let inviteStatus = invitation?.status ?? null;
    if (inviteStatus === "pending" && invitation && new Date(invitation.expires_at).getTime() < Date.now()) inviteStatus = "expired";
    const factors = authUser
      ? await admin.auth.admin.mfa.listFactors({ userId: profile.id })
      : { data: null, error: null };

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      active: profile.active,
      invited_at: profile.invited_at,
      accepted_at: profile.accepted_at,
      suspended_at: profile.suspended_at,
      createdAt: profile.created_at,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
      emailConfirmedAt: authUser?.email_confirmed_at ?? null,
      mfaEnabled: Boolean(factors.data?.factors.some((factor) => factor.status === "verified")),
      permissions,
      overrides,
      inviteStatus,
      inviteExpiresAt: invitation?.expires_at ?? null,
      lastEmailStatus: invitation?.email_log_id ? emailStatusById.get(invitation.email_log_id) ?? null : null,
    } satisfies AdminUser;
  }));
}
