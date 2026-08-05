import { NextRequest, NextResponse } from "next/server";
import { processDueCampaigns } from "@/features/newsletter/campaign-service";

export async function POST(request: NextRequest) {
  const expected = process.env.NEWSLETTER_CRON_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const result = await processDueCampaigns();
  return NextResponse.json({ ok: true, ...result });
}
