import { NextResponse } from "next/server";

import { testWebhookAction } from "@/features/webhooks/actions";
import { getPermissionAccess } from "@/features/auth/permissions";

export async function POST(request: Request) {
  if (!await getPermissionAccess("webhooks.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await testWebhookAction(await request.json().catch(() => null));
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
