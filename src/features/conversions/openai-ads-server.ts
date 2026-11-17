import "server-only";

import { openAIAdsPixelId, openAIAdsWhatsAppEvent } from "./openai-ads";

export async function sendOpenAIWhatsAppClick(apiKey: string, id: string, sourceUrl: string, oppref?: string) {
  try {
    const response = await fetch(`https://bzr.openai.com/v1/events?pid=${openAIAdsPixelId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ events: [{
        id,
        type: "custom",
        custom_event_name: openAIAdsWhatsAppEvent,
        timestamp_ms: Date.now(),
        action_source: "web",
        source_url: sourceUrl,
        oppref,
        opt_out: true,
        data: { type: "custom" },
      }] }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(2_500),
    });
    if (!response.ok) console.warn("OpenAI Ads WhatsApp delivery rejected", response.status);
    return response.ok;
  } catch {
    console.warn("OpenAI Ads WhatsApp delivery unavailable");
    return false;
  }
}
