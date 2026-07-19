import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminProfile } from "@/features/auth/types";

export async function getCurrentProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, active")
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

  return profile;
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
    .select("id, name, email, role, active")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os usuários administrativos.");
  }

  return data;
}
