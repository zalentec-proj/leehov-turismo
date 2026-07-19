import { NextResponse } from "next/server";

import { testWebhookAction } from "@/features/webhooks/actions";

export async function POST(request: Request) {
  const result = await testWebhookAction(await request.json().catch(() => null));
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
