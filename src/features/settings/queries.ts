import "server-only";

import { requireAdminProfile } from "@/features/auth/queries";
import type { AdminSiteSettings, EmailSettings, PublicSiteSettings, TrackingSettings } from "@/features/settings/types";
import { LEEHOV_WHATSAPP_NUMBER } from "@/features/settings/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const contactFallback = { phone: "", contactEmail: "contato@leehovturismo.com.br", address: "" };
const whatsappFallback = { number: LEEHOV_WHATSAPP_NUMBER, defaultMessage: "Olá! Gostaria de falar com a equipe Leehov.", caravanMessage: "Olá! Gostaria de saber mais sobre esta caravana." };
const homeFallback = { videoUrl: "", testimonialsEyebrow: "Avaliado por quem viaja conosco", testimonialsTitle: "Depoimentos" };
const seoFallback = { siteName: "Leehov Turismo", titleTemplate: "%s | Leehov Turismo", defaultDescription: "Caravanas e viagens em grupo acompanhadas pela Leehov Turismo.", ogImageAssetId: "", ogImageUrl: "" };
const emailFallback: EmailSettings = { enabled: true, visitorConfirmationsEnabled: true, contactRecipients: [], leadRecipients: [], senderName: "Leehov Turismo", replyTo: "", footerText: "Leehov Turismo", whatsapp: "" };

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

const textValue = (record: Record<string, unknown>, key: string, fallback = "") => typeof record[key] === "string" ? record[key] as string : fallback;
const boolValue = (record: Record<string, unknown>, key: string, fallback: boolean) => typeof record[key] === "boolean" ? record[key] as boolean : fallback;
const numberValue = (record: Record<string, unknown>, key: string, fallback: number) => typeof record[key] === "number" ? record[key] as number : fallback;
const listValue = (record: Record<string, unknown>, key: string) => Array.isArray(record[key]) ? (record[key] as unknown[]).filter((item): item is string => typeof item === "string") : [];
const safeHttpsUrl = (value: string) => { try { return new URL(value).protocol === "https:" ? value : ""; } catch { return ""; } };
const validTrackingId = (value: string, pattern: RegExp) => pattern.test(value) ? value : "";

async function signOgImage(path?: string | null) {
  if (!path) return "";
  const admin = createAdminClient();
  const { data } = await admin.storage.from("site-media").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

function rowMap(rows: Array<{ key: string; value: unknown; media_asset_id?: string | null; media?: unknown }>) {
  return new Map(rows.map((row) => [row.key, row]));
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value, media_asset_id").eq("public_read", true);
  const rows = rowMap((data ?? []) as unknown as Array<{ key: string; value: unknown; media_asset_id: string | null }>);
  const contact = objectValue(rows.get("contact_info")?.value);
  const whatsapp = objectValue(rows.get("whatsapp_settings")?.value);
  const social = objectValue(rows.get("social_links")?.value);
  const home = objectValue(rows.get("home_settings")?.value);
  const seo = objectValue(rows.get("seo_global")?.value);
  const consent = objectValue(rows.get("cookie_consent")?.value);
  const seoRow = rows.get("seo_global") as { media_asset_id?: string | null } | undefined;
  let ogStoragePath = "";
  if (seoRow?.media_asset_id) {
    const { data: media } = await createAdminClient().from("media_assets").select("storage_path").eq("id", seoRow.media_asset_id).maybeSingle();
    ogStoragePath = media?.storage_path ?? "";
  }
  const resolved = {
    contact: { phone: textValue(contact, "phone"), contactEmail: textValue(contact, "contactEmail", contactFallback.contactEmail), address: textValue(contact, "address") },
    whatsapp: { number: textValue(whatsapp, "number"), defaultMessage: textValue(whatsapp, "defaultMessage", whatsappFallback.defaultMessage), caravanMessage: textValue(whatsapp, "caravanMessage", whatsappFallback.caravanMessage) },
    social: { instagram: safeHttpsUrl(textValue(social, "instagram")), facebook: safeHttpsUrl(textValue(social, "facebook")), youtube: safeHttpsUrl(textValue(social, "youtube")) },
    home: { videoUrl: safeHttpsUrl(textValue(home, "videoUrl")), testimonialsEyebrow: textValue(home, "testimonialsEyebrow", homeFallback.testimonialsEyebrow), testimonialsTitle: textValue(home, "testimonialsTitle", homeFallback.testimonialsTitle) },
    seo: { siteName: textValue(seo, "siteName", seoFallback.siteName), titleTemplate: textValue(seo, "titleTemplate", seoFallback.titleTemplate), defaultDescription: textValue(seo, "defaultDescription", seoFallback.defaultDescription), ogImageAssetId: seoRow?.media_asset_id ?? "", ogImageUrl: await signOgImage(ogStoragePath) },
    consent: { enabled: boolValue(consent, "enabled", true), version: numberValue(consent, "version", 1), durationDays: numberValue(consent, "durationDays", 180) },
  };
  return { ...resolved, whatsappNumber: resolved.whatsapp.number, whatsappDefaultMessage: resolved.whatsapp.defaultMessage, contactEmail: resolved.contact.contactEmail };
}

export async function getAdminSiteSettings(): Promise<AdminSiteSettings> {
  await requireAdminProfile();
  const [publicSettings, privateRows] = await Promise.all([
    getPublicSiteSettings(),
    createAdminClient().from("site_settings").select("key, value").in("key", ["email_settings", "analytics_settings"]),
  ]);
  const rows = rowMap((privateRows.data ?? []) as Array<{ key: string; value: unknown }>);
  const email = objectValue(rows.get("email_settings")?.value);
  const tracking = objectValue(rows.get("analytics_settings")?.value);
  return {
    ...publicSettings,
    email: {
      enabled: boolValue(email, "enabled", emailFallback.enabled), visitorConfirmationsEnabled: boolValue(email, "visitorConfirmationsEnabled", emailFallback.visitorConfirmationsEnabled),
      contactRecipients: listValue(email, "contactRecipients"), leadRecipients: listValue(email, "leadRecipients"), senderName: textValue(email, "senderName", emailFallback.senderName),
      replyTo: textValue(email, "replyTo"), footerText: textValue(email, "footerText", emailFallback.footerText), whatsapp: textValue(email, "whatsapp"),
    },
    tracking: { gaMeasurementId: validTrackingId(textValue(tracking, "gaMeasurementId"), /^G-[A-Z0-9]{4,20}$/), gtmContainerId: validTrackingId(textValue(tracking, "gtmContainerId"), /^GTM-[A-Z0-9]{4,20}$/), metaPixelId: validTrackingId(textValue(tracking, "metaPixelId"), /^[0-9]{5,30}$/) },
  };
}

export async function getServerEmailSettings(): Promise<EmailSettings> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_settings").select("value").eq("key", "email_settings").maybeSingle();
  const value = objectValue(data?.value);
  return { enabled: boolValue(value, "enabled", true), visitorConfirmationsEnabled: boolValue(value, "visitorConfirmationsEnabled", true), contactRecipients: listValue(value, "contactRecipients"), leadRecipients: listValue(value, "leadRecipients"), senderName: textValue(value, "senderName", "Leehov Turismo"), replyTo: textValue(value, "replyTo"), footerText: textValue(value, "footerText", "Leehov Turismo"), whatsapp: textValue(value, "whatsapp") };
}

export async function getServerTrackingSettings(): Promise<TrackingSettings> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_settings").select("value").eq("key", "analytics_settings").maybeSingle();
  const value = objectValue(data?.value);
  return { gaMeasurementId: validTrackingId(textValue(value, "gaMeasurementId"), /^G-[A-Z0-9]{4,20}$/), gtmContainerId: validTrackingId(textValue(value, "gtmContainerId"), /^GTM-[A-Z0-9]{4,20}$/), metaPixelId: validTrackingId(textValue(value, "metaPixelId"), /^[0-9]{5,30}$/) };
}
