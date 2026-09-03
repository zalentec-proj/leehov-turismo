import { NextResponse } from "next/server";

import { processRdDealWebhook } from "@/features/meta-conversions/processor";
import { isRdDealUpdatedWebhook } from "@/features/meta-conversions/rd-payload";
import { secretsMatch } from "@/lib/security/request";

const MAX_BODY_BYTES = 128 * 1024;

export async function POST(request: Request) {
  if (!secretsMatch(request.headers.get("x-leehov-rd-webhook-key"), process.env.RD_META_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(length) || length < 0 || length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isRdDealUpdatedWebhook(payload)) {
    return NextResponse.json({ ignored: true, message: "Unsupported RD event" });
  }
  try {
    const result = await processRdDealWebhook(payload);
    return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
  } catch {
    return NextResponse.json({ error: "Integration unavailable" }, { status: 503 });
  }
}
