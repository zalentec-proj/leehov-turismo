import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requirePermission } from "@/features/auth/permissions";
import { getRdOauthCallbackUrl, hasRdOauthClientConfiguration } from "@/features/meta-conversions/rd-client";

const STATE_COOKIE = "leehov_rd_oauth_state";

export async function GET() {
  await requirePermission("meta_conversions.manage");
  if (!hasRdOauthClientConfiguration()) {
    return NextResponse.json({ error: "Configure as credenciais OAuth e a chave de cifragem antes de iniciar a autorização." }, { status: 503 });
  }

  const state = randomUUID();
  const authorizationUrl = new URL("https://accounts.rdstation.com/oauth/authorize");
  authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.RD_CRM_CLIENT_ID ?? "",
    redirect_uri: getRdOauthCallbackUrl(),
    state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 10 * 60,
    path: "/api/integrations/rd/oauth",
  });
  return response;
}
