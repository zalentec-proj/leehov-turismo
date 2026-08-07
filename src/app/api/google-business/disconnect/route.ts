import { NextResponse } from "next/server";

import { getPermissionAccess } from "@/features/auth/permissions";
import { getLiveGoogleConnection, GOOGLE_TOKEN_KEY_ENV } from "@/lib/google/business-profile";
import { decryptSecret } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const access = await getPermissionAccess("testimonials.manage_google");
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { profile } = access;
  const connection = await getLiveGoogleConnection();
  if (!connection) return NextResponse.json({ success: true, message: "A integração já está desconectada." });

  let revokeWarning = "";
  try {
    const refreshToken = decryptSecret(connection.refresh_token_ciphertext, GOOGLE_TOKEN_KEY_ENV);
    const response = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) revokeWarning = " O Google não confirmou a revogação; revise o acesso na Conta Google.";
  } catch {
    revokeWarning = " Não foi possível confirmar a revogação no Google; revise o acesso na Conta Google.";
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("google_business_connections").update({
    refresh_token_ciphertext: null,
    status: "disconnected",
    disconnected_at: now,
    updated_by: profile.id,
  }).eq("id", connection.id);
  if (error) return NextResponse.json({ success: false, message: "Não foi possível desconectar a integração." }, { status: 500 });

  await supabase.from("google_business_settings").update({
    connection_id: null,
    account_id: null,
    location_id: null,
    google_maps_url: null,
    enabled: false,
    display_mode: "manual",
    sync_lock_token: null,
    sync_lock_until: null,
    last_sync_status: "disconnected",
    last_sync_error: null,
    updated_by: profile.id,
  }).eq("singleton", true);

  return NextResponse.json({ success: true, message: `Google Business Profile desconectado.${revokeWarning}` });
}
