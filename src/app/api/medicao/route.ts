import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOpenAIWhatsAppClick } from "@/features/conversions/openai-ads-server";
import { hasMeasurementConsent, isInternalTraffic, measurementSchema, measurementVisitorId, snapshotFromClient, validateEventPath } from "@/features/conversions/server";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
const maxBody = 4096;

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || (request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin")) return false;
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return origin === new URL(request.url).origin || Boolean(configured && origin === new URL(configured).origin);
}

async function readSmallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader || Number(request.headers.get("content-length") ?? "0") > maxBody) return null;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBody) { await reader.cancel(); return null; }
    body += decoder.decode(value, { stream: true });
  }
  return JSON.parse(body + decoder.decode()) as unknown;
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return new Response(null, { status: 403 });
    if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415 });
    const parsed = measurementSchema.safeParse(await readSmallJson(request).catch(() => null));
    if (!parsed.success) return new Response(null, { status: 400 });
    const input = parsed.data;
    // Ignore automated/non-user requests and fail closed for tracking without consent.
    if (/bot\b|crawler|spider|slurp|headlesschrome|preview|facebookexternalhit|meta-externalagent/i.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
    if (input.type !== "erase" && !await hasMeasurementConsent()) return new Response(null, { status: 204 });

    const secret = process.env.FORM_SECURITY_SECRET;
    if (!secret || secret.length < 32) return new Response(null, { status: 503 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
    const scope = input.type === "openai_whatsapp" ? "openai_whatsapp" : "site_measurement";
    const hash = createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
    const admin = createAdminClient();
    const limit = await admin.rpc("consume_measurement_rate_limit", { p_hash: hash });
    if (limit.error) return new Response(null, { status: 503 });
    if (!limit.data) return new Response(null, { status: 429 });

    if (input.type === "erase") {
      const visitorId = measurementVisitorId(input.visitorId);
      if (!visitorId) return new Response(null, { status: 503 });
      const { error } = await admin.rpc("erase_site_measurement", { p_visitor_id: visitorId });
      return new Response(null, { status: error ? 503 : 204 });
    }

    const path = validateEventPath(input.path);
    if (!path) return new Response(null, { status: 400 });
    if (input.type === "openai_whatsapp") {
      const apiKey = process.env.OPENAI_CONVERSIONS_API_KEY?.trim();
      if (!apiKey) return new Response(null, { status: 204 });
      const sourceUrl = new URL(path, process.env.NEXT_PUBLIC_SITE_URL);
      if (sourceUrl.protocol !== "https:") return new Response(null, { status: 503 });
      const sent = await sendOpenAIWhatsAppClick(apiKey, input.id, sourceUrl.href, input.oppref);
      return new Response(null, { status: sent ? 204 : 502 });
    }

    const visitorId = measurementVisitorId(input.context.visitorId);
    if (!visitorId) return new Response(null, { status: 503 });
    const slug = path.startsWith("/caravanas/") ? path.split("/")[2] : null;
    let caravanId: string | undefined;
    if (slug) {
      const result = await admin.from("caravans").select("id").eq("slug", slug).eq("published", true).maybeSingle();
      if (result.error) return new Response(null, { status: 503 });
      if (!result.data) return new Response(null, { status: 204 });
      caravanId = result.data.id;
    }

    const result = await admin.from("site_measurement_events").upsert({
      id: input.id, kind: input.type, page_path: path, caravan_id: caravanId,
      visitor_id: visitorId, session_id: input.context.sessionId,
      attribution: snapshotFromClient(input.context) as Json,
      reference: input.type === "whatsapp" ? input.reference : null,
      is_test: await isInternalTraffic(),
    }, { onConflict: "id", ignoreDuplicates: true });
    return new Response(null, { status: result.error ? (result.error.code === "23505" ? 409 : 503) : 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
