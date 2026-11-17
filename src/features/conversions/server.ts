import "server-only";

import { createHmac } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import type { Json } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSiteSettings } from "@/features/settings/queries";
import { cleanTouch, getAttribution, publicPath, type AttributionSnapshot } from "./attribution";
import { measurementCookie, measurementExpiry } from "./client";
import { openAIClickReferencePattern } from "./openai-ads";
import { referencePattern } from "./whatsapp";

const opaqueId = z.uuidv4();
export const contextSchema = z.object({
  visitorId: opaqueId,
  sessionId: opaqueId,
  first: z.unknown().optional(),
  last: z.unknown().optional(),
  session: z.unknown().optional(),
});
export const measurementSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("page"), id: opaqueId, path: z.string().max(180), context: contextSchema }),
  z.object({ type: z.literal("whatsapp"), id: opaqueId, path: z.string().max(180), context: contextSchema, reference: z.string().regex(referencePattern) }),
  z.strictObject({ type: z.literal("openai_whatsapp"), id: opaqueId, path: z.string().max(180), oppref: z.string().regex(openAIClickReferencePattern).optional() }),
  z.object({ type: z.literal("erase"), visitorId: opaqueId }),
]);

export function snapshotFromClient(input: z.infer<typeof contextSchema>): AttributionSnapshot {
  return getAttribution({ first: cleanTouch(input.first), last: cleanTouch(input.last), session: cleanTouch(input.session) }, Date.now());
}

export const hasMeasurementConsent = cache(async function () {
  const jar = await cookies();
  const marker = jar.get(measurementCookie)?.value;
  if (jar.get("leehov_cookie_consent")?.value !== "analytics" || !measurementExpiry(marker)) return false;
  const { consent } = await getPublicSiteSettings();
  return consent.enabled && Boolean(measurementExpiry(marker, consent.version));
});

export async function formMeasurement(raw: unknown) {
  const parsed = contextSchema.safeParse(raw);
  if (!parsed.success || !await hasMeasurementConsent()) return {};
  const snapshot = snapshotFromClient(parsed.data);
  if (!snapshot.session) return {};
  // The event comes from the same public browser that submitted the validated form.
  // Keep tags as observed signals; this is not verification with an ad network.
  const visitorId = measurementVisitorId(parsed.data.visitorId);
  return visitorId ? { attribution: snapshot as Json, visitorId, basis: "observed" } : {};
}

export function measurementVisitorId(capability: string) {
  const secret = process.env.FORM_SECURITY_SECRET;
  if (!secret || secret.length < 32) return undefined;
  const hex = createHmac("sha256", secret).update("site-measurement-visitor:v1:" + capability).digest("hex");
  // Stored identifiers cannot be reversed into the browser's erase capability.
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join("-");
}

export async function isInternalTraffic() {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview" || /(?:^|;\s*)sb-[\w-]+-auth-token(?:\.\d+)?=/.test(cookie);
}

export async function captureLead(input: Record<string, Json | undefined>) {
  const { data, error } = await createAdminClient().rpc("capture_conversion_lead", { p_data: input });
  if (error) throw new Error("Não foi possível registrar o lead.");
  return captureResult.parse(data);
}

const captureResult = z.object({
  id: z.uuid().optional(),
  result: z.enum(["created", "updated", "replay", "duplicate", "reference_linked", "reference_missing", "lead_missing"]),
});

export function validateEventPath(value: string) {
  return publicPath(value);
}
