import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/features/auth/queries";
import { buildGoogleAuthorizationUrl, getGoogleOAuthConfiguration } from "@/lib/google/business-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminProfile();
  const config = getGoogleOAuthConfiguration();
  if (!config.configured) {
    return NextResponse.redirect(new URL("/admin/configuracoes?tab=google&google=not-configured", request.url));
  }

  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("leehov_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/api/google-business/callback",
  });

  return NextResponse.redirect(buildGoogleAuthorizationUrl(state));
}
