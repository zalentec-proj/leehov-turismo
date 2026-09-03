import { NextResponse } from "next/server";

import { retryFailedMetaConversions } from "@/features/meta-conversions/processor";
import { secretsMatch } from "@/lib/security/request";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secretsMatch(token, process.env.META_CONVERSIONS_CRON_SECRET)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await retryFailedMetaConversions();
  return NextResponse.json({ processed: results.length, sent: results.filter((item) => item.status === "sent").length });
}
