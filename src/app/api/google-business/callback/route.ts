import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/features/auth/queries";
import {
  exchangeGoogleAuthorizationCode,
  getLiveGoogleConnection,
  GOOGLE_BUSINESS_SCOPE,
  GOOGLE_TOKEN_KEY_ENV,
} from "@/lib/google/business-profile";
import { encryptSecret } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function redirectWithStatus(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/admin/configuracoes?tab=google&google=${encodeURIComponent(status)}`, request.url));
}

export async function GET(request: Request) {
  const profile = await requireAdminProfile();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("leehov_google_oauth_state")?.value;
  cookieStore.set("leehov_google_oauth_state", "", { maxAge: 0, path: "/api/google-business/callback" });

  if (!state || !expectedState || !safeEqual(state, expectedState)) {
    return redirectWithStatus(request, "invalid-state");
  }
  if (providerError) return redirectWithStatus(request, "provider-error");
  if (!code) return redirectWithStatus(request, "missing-code");

  try {
    const token = await exchangeGoogleAuthorizationCode(code);
    const scopes = (token.scope ?? "").split(/\s+/).filter(Boolean);
    if (scopes.length !== 1 || scopes[0] !== GOOGLE_BUSINESS_SCOPE) {
      return redirectWithStatus(request, "invalid-scope");
    }

    const existing = await getLiveGoogleConnection();
    const ciphertext = token.refresh_token
      ? encryptSecret(token.refresh_token, GOOGLE_TOKEN_KEY_ENV)
      : existing?.refresh_token_ciphertext;
    if (!ciphertext) return redirectWithStatus(request, "missing-refresh-token");

    const supabase = createAdminClient();
    const payload = {
      refresh_token_ciphertext: ciphertext,
      scopes,
      status: existing?.location_id ? "connected" as const : "pending_location" as const,
      disconnected_at: null,
      connected_at: new Date().toISOString(),
      connected_by: profile.id,
      updated_by: profile.id,
    };

    const result = existing
      ? await supabase.from("google_business_connections").update(payload).eq("id", existing.id).select("id").single()
      : await supabase.from("google_business_connections").insert(payload).select("id").single();

    if (result.error || !result.data) throw new Error("Não foi possível armazenar a conexão OAuth.");
    await supabase.from("google_business_settings").update({
      connection_id: result.data.id,
      last_sync_status: "awaiting_location",
      last_sync_error: null,
      updated_by: profile.id,
    }).eq("singleton", true);

    return redirectWithStatus(request, "connected");
  } catch {
    return redirectWithStatus(request, "callback-failed");
  }
}
