"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/features/auth/queries";
import { siteSettingsSchema } from "@/features/settings/schema";
import type { SiteSettingsActionResult } from "@/features/settings/types";
import { createClient } from "@/lib/supabase/server";

export async function saveSiteSettingsAction(input: unknown): Promise<SiteSettingsActionResult> {
  const profile = await requireAdminProfile();
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise as configurações." };
  const supabase = await createClient();
  const rows = [
    { key: "contact_info", value: parsed.data.contact, media_asset_id: null },
    { key: "whatsapp_settings", value: parsed.data.whatsapp, media_asset_id: null },
    { key: "social_links", value: parsed.data.social, media_asset_id: null },
    { key: "home_settings", value: parsed.data.home, media_asset_id: null },
    { key: "seo_global", value: { siteName: parsed.data.seo.siteName, titleTemplate: parsed.data.seo.titleTemplate, defaultDescription: parsed.data.seo.defaultDescription }, media_asset_id: parsed.data.seo.ogImageAssetId || null },
    { key: "email_settings", value: parsed.data.email, media_asset_id: null },
    { key: "analytics_settings", value: parsed.data.tracking, media_asset_id: null },
    { key: "cookie_consent", value: parsed.data.consent, media_asset_id: null },
  ];
  for (const row of rows) {
    const { error } = await supabase.from("site_settings").update({ value: row.value, media_asset_id: row.media_asset_id, updated_by: profile.id }).eq("key", row.key);
    if (error) return { success: false, message: `Não foi possível salvar ${row.key}: ${error.message}` };
  }
  for (const path of ["/", "/contato", "/caravanas", "/blog", "/politica-de-privacidade", "/admin", "/admin/configuracoes"]) revalidatePath(path);
  return { success: true, message: "Configurações salvas e conteúdo revalidado." };
}
