import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getPermissionAccess } from "@/features/auth/permissions";
import { buildGoogleAuthorizationUrl, getGoogleOAuthConfiguration } from "@/lib/google/business-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await getPermissionAccess("testimonials.manage_google")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
