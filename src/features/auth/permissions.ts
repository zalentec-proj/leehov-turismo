import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireMfaAssurance } from "@/features/auth/queries";
import { resolveEffectivePermissions } from "@/features/auth/permission-policy";

export const permissionGroups = [
  { module: "dashboard", label: "Dashboard", permissions: [{ key: "dashboard.view", label: "Visualizar" }] },
  { module: "caravans", label: "Caravanas", permissions: [
    { key: "caravans.view", label: "Visualizar" }, { key: "caravans.create", label: "Criar" },
    { key: "caravans.update", label: "Editar" }, { key: "caravans.publish", label: "Publicar" },
    { key: "caravans.manage_media", label: "Gerenciar imagens" }, { key: "caravans.manage_categories", label: "Gerenciar categorias" },
  ] },
  { module: "blog", label: "Blog", permissions: [
    { key: "blog.view", label: "Visualizar" }, { key: "blog.create", label: "Criar" },
    { key: "blog.update", label: "Editar" }, { key: "blog.delete_draft", label: "Excluir rascunhos" },
    { key: "blog.publish", label: "Publicar" }, { key: "blog.manage_media", label: "Gerenciar imagens" },
    { key: "blog.manage_categories", label: "Gerenciar categorias" },
  ] },
  { module: "leads", label: "Leads", permissions: [
    { key: "leads.view", label: "Visualizar" }, { key: "leads.create", label: "Criar" },
    { key: "leads.update", label: "Editar pipeline" }, { key: "leads.assign", label: "Atribuir" },
    { key: "leads.interact", label: "Registrar interações" },
  ] },
  { module: "newsletter", label: "Newsletter", permissions: [
    { key: "newsletter.view", label: "Visualizar" }, { key: "newsletter.manage_drafts", label: "Gerenciar rascunhos" },
    { key: "newsletter.send", label: "Enviar e agendar" }, { key: "newsletter.manage_subscribers", label: "Gerenciar inscritos" },
    { key: "newsletter.view_logs", label: "Visualizar logs" },
  ] },
  { module: "testimonials", label: "Depoimentos", permissions: [
    { key: "testimonials.view", label: "Visualizar" }, { key: "testimonials.manage", label: "Criar e editar" },
    { key: "testimonials.delete", label: "Excluir" }, { key: "testimonials.publish", label: "Publicar" },
    { key: "testimonials.manage_google", label: "Administrar Google Business" },
  ] },
  { module: "popups", label: "Pop-ups", permissions: [
    { key: "popups.view", label: "Visualizar" }, { key: "popups.manage", label: "Criar e editar" },
    { key: "popups.delete", label: "Excluir" }, { key: "popups.publish", label: "Publicar" },
  ] },
  { module: "media", label: "Mídia", permissions: [
    { key: "media.view", label: "Visualizar" }, { key: "media.upload", label: "Enviar" },
    { key: "media.update", label: "Editar" }, { key: "media.delete", label: "Excluir" },
  ] },
  { module: "settings", label: "Configurações", permissions: [
    { key: "settings.view", label: "Visualizar" }, { key: "settings.manage", label: "Alterar" },
  ] },
  { module: "webhooks", label: "Webhooks", permissions: [
    { key: "webhooks.view", label: "Visualizar" }, { key: "webhooks.manage", label: "Administrar" },
  ] },
] as const;

export type PermissionKey = (typeof permissionGroups)[number]["permissions"][number]["key"] |
  "users.view" | "users.invite" | "users.update" | "users.manage_permissions" |
  "users.suspend" | "users.delete" | "users.reset_mfa";

export const allPermissionKeys = permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.key)) as PermissionKey[];

export const routePermissions: Array<{ prefix: string; permission: PermissionKey }> = [
  { prefix: "/admin/usuarios", permission: "users.view" },
  { prefix: "/admin/configuracoes", permission: "settings.view" },
  { prefix: "/admin/webhooks", permission: "webhooks.view" },
  { prefix: "/admin/caravanas", permission: "caravans.view" },
  { prefix: "/admin/blog", permission: "blog.view" },
  { prefix: "/admin/leads", permission: "leads.view" },
  { prefix: "/admin/newsletter", permission: "newsletter.view" },
  { prefix: "/admin/depoimentos", permission: "testimonials.view" },
  { prefix: "/admin/popups", permission: "popups.view" },
  { prefix: "/admin/midia", permission: "media.view" },
  { prefix: "/admin", permission: "dashboard.view" },
];

export const getEffectivePermissions = cache(async (profileId: string, role: "admin" | "editor", active: boolean) => {
  const adminPermissions = [...allPermissionKeys,
    "users.view", "users.invite", "users.update", "users.manage_permissions", "users.suspend", "users.delete", "users.reset_mfa",
  ] as PermissionKey[];
  if (!active) return [] as PermissionKey[];
  if (role === "admin") return adminPermissions;

  const admin = createAdminClient();
  const [{ data: defaults }, { data: overrides }] = await Promise.all([
    admin.from("role_permissions").select("permission_key, allowed").eq("role", role),
    admin.from("profile_permission_overrides").select("permission_key, allowed").eq("profile_id", profileId),
  ]);
  return resolveEffectivePermissions({ active, role, allPermissions: adminPermissions, defaults: defaults ?? [], overrides: overrides ?? [] }) as PermissionKey[];
});

export async function requirePermission(permission: PermissionKey) {
  const profile = await getCurrentProfile();
  if (!profile?.active) redirect("/admin/login?error=inactive");
  await requireMfaAssurance();
  const permissions = await getEffectivePermissions(profile.id, profile.role, profile.active);
  if (!permissions.includes(permission)) redirect("/admin/sem-acesso");
  return { profile, permissions };
}

export async function requireAnyPermission(permissionsToCheck: PermissionKey[]) {
  const profile = await getCurrentProfile();
  if (!profile?.active) redirect("/admin/login?error=inactive");
  await requireMfaAssurance();
  const permissions = await getEffectivePermissions(profile.id, profile.role, profile.active);
  if (!permissionsToCheck.some((permission) => permissions.includes(permission))) redirect("/admin/sem-acesso");
  return { profile, permissions };
}

export async function getPermissionAccess(permission: PermissionKey) {
  const profile = await getCurrentProfile();
  if (!profile?.active) return null;
  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") return null;
  const permissions = await getEffectivePermissions(profile.id, profile.role, profile.active);
  return permissions.includes(permission) ? { profile, permissions } : null;
}

export function firstAllowedAdminPath(permissions: PermissionKey[]) {
  return routePermissions.find(({ permission }) => permissions.includes(permission))?.prefix ?? "/admin/sem-acesso";
}
