import "server-only";

import { requirePermission } from "@/features/auth/permissions";
import { hasRdCredentials } from "@/features/meta-conversions/rd-client";
import type { MetaConversionCampaign, MetaConversionEvent, MetaConversionMetrics, MetaConversionSettings } from "@/features/meta-conversions/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getMetaConversionsDashboard(): Promise<{ settings: MetaConversionSettings; campaigns: MetaConversionCampaign[]; events: MetaConversionEvent[]; metrics: MetaConversionMetrics }> {
  await requirePermission("meta_conversions.view");
  const admin = createAdminClient();
  const [{ data: settings }, { data: campaigns }, { data: events }] = await Promise.all([
    admin.from("meta_conversion_settings").select("*").eq("id", true).single(),
    admin.from("meta_conversion_campaigns").select("rd_campaign_id, name, active").order("name"),
    admin.from("meta_conversion_events").select("id, rd_deal_id, rd_campaign_name, sale_value, status, attempts, last_error, created_at, completed_at").order("created_at", { ascending: false }).limit(100),
  ]);
  if (!settings) throw new Error("A configuração de conversões Meta ainda não foi migrada.");
  const rows = events ?? [];
  return {
    settings: {
      enabled: settings.enabled, sourceId: settings.rd_source_id, pixelId: settings.meta_pixel_id, testEventCode: settings.test_event_code ?? "",
      credentialsReady: Boolean(process.env.RD_META_WEBHOOK_SECRET && hasRdCredentials() && process.env.META_CAPI_ACCESS_TOKEN),
    },
    campaigns: (campaigns ?? []).map((item) => ({ id: item.rd_campaign_id, name: item.name, active: item.active })),
    events: rows.map((item) => ({ id: item.id, dealId: item.rd_deal_id, routeName: item.rd_campaign_name ?? "—", saleValue: item.sale_value, status: item.status, attempts: item.attempts, error: item.last_error ?? "", createdAt: item.created_at, completedAt: item.completed_at ?? "" })),
    metrics: {
      sent: rows.filter((item) => item.status === "sent").length,
      ignored: rows.filter((item) => item.status === "ignored").length,
      failed: rows.filter((item) => item.status === "failed").length,
      pending: rows.filter((item) => item.status === "pending" || item.status === "processing").length,
      reviewRequired: rows.filter((item) => item.status === "review_required").length,
    },
  };
}
