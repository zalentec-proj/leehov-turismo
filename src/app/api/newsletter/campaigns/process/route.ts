import { NextRequest, NextResponse } from "next/server";
import { processDueCampaigns } from "@/features/newsletter/campaign-service";
import { secretsMatch } from "@/lib/security/request";

export async function POST(request: NextRequest) {
  const expected = process.env.NEWSLETTER_CRON_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secretsMatch(provided, expected)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const result = await processDueCampaigns();
  return NextResponse.json({ ok: true, ...result });
}
