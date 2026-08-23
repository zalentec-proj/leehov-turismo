import { NextResponse } from "next/server";

import { testWebhookAction } from "@/features/webhooks/actions";
import { getPermissionAccess } from "@/features/auth/permissions";
import { parseSafeAdminJson } from "@/lib/security/request";

export async function POST(request: Request) {
  const body = await parseSafeAdminJson<unknown>(request);
  if (body === null) return NextResponse.json({ error: "Requisição não permitida" }, { status: 403 });
  if (!await getPermissionAccess("webhooks.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await testWebhookAction(body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
