import { openAIClickReferencePattern } from "./openai-ads";

export const attributionWindow = 30 * 86400_000;

export const channelLabels = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  openai_ads: "ChatGPT Ads",
  paid_other: "Outras campanhas pagas",
  organic_search: "Busca orgânica",
  organic_social: "Redes sociais orgânicas",
  ai_referral: "Assistentes de IA",
  email: "E-mail / newsletter",
  referral: "Sites de referência",
  recommendation: "Indicação",
  offline: "Telefone / presencial",
  direct: "Acesso direto",
  unknown: "Origem desconhecida",
} as const;

export type Channel = keyof typeof channelLabels;
export type Touch = {
  source?: string; medium?: string; campaign?: string; campaignId?: string;
  content?: string; term?: string; referrerDomain?: string; landingPath?: string;
  google?: true; meta?: true; openai?: true; at?: number;
};
export type ClassifiedTouch = Touch & { channel: Channel };
export type AttributionSnapshot = { first?: ClassifiedTouch; session?: ClassifiedTouch; conversion?: ClassifiedTouch };
export type AttributionContext = { first?: Touch; last?: Touch; session?: Touch };

const paid = /^(cpc|ppc|cpm|cpv|paid|paid[-_ ]?(search|social|media|display)|display|retargeting|remarketing)$/i;
const googleSources = new Set(["google", "googleads", "google_ads", "google-ads", "adwords"]);
const metaSources = new Set(["fb", "ig", "facebook", "instagram", "meta", "meta_ads", "meta-ads", "messenger", "threads"]);
const openAISources = new Set(["chatgpt", "chatgpt.com", "openai", "openai_ads", "openai-ads"]);
const social = /(^|\.)(facebook\.com|instagram\.com|fb\.com|threads\.(net|com)|linkedin\.com|tiktok\.com|pinterest\.com|x\.com|twitter\.com)$/;
const search = /(^|\.)(google\.(com(\.[a-z]{2})?|[a-z]{2})|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org)$/;
const ai = /(^|\.)(chatgpt\.com|chat\.openai\.com|claude\.ai|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/;

export function publicPath(value: unknown) {
  if (typeof value !== "string" || value.length > 180) return undefined;
  if (/^\/(?:caravanas|blog)\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/.test(value)
    || /^\/(?:caravanas|blog|contato|quem-somos|politica-de-privacidade)?\/?$/.test(value)) {
    return value === "/" ? value : value.replace(/\/$/, "");
  }
  return undefined;
}

export function cleanCampaignTag(value: unknown, id = false) {
  if (typeof value !== "string") return undefined;
  const tag = value.trim();
  if (!tag || tag.length > 100 || !(id ? /^[a-z0-9_-]+$/i : /^[\p{L}\p{M}\p{N}_ .-]+$/u).test(tag)) return undefined;
  if (!id && /(?:^|[ ._-])(?:\d[ ._-]*){8,}(?:$|[ ._-])/.test(tag)) return undefined;
  return tag;
}

function cleanDomain(value: unknown) {
  if (typeof value !== "string" || value.length > 200) return undefined;
  const domain = value.toLowerCase().replace(/\.$/, "");
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return undefined;
  if (/(^|\.)leehovturismo\.com\.br$/.test(domain)) return undefined;
  return domain;
}

export function cleanTouch(value: unknown): Touch {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const out: Touch = {};
  for (const key of ["source", "medium", "campaign", "campaignId", "content", "term"] as const) {
    const cleaned = cleanCampaignTag(raw[key], key === "campaignId");
    if (cleaned) out[key] = key === "source" || key === "medium" ? cleaned.toLowerCase() : cleaned;
  }
  const domain = cleanDomain(raw.referrerDomain);
  const path = publicPath(raw.landingPath);
  if (domain) out.referrerDomain = domain;
  if (path) out.landingPath = path;
  for (const key of ["google", "meta", "openai"] as const) {
    if (raw[key] === true) out[key] = true;
  }
  if (typeof raw.at === "number" && Number.isSafeInteger(raw.at)) out.at = raw.at;
  return out;
}

function hasOpaqueId(value: string | null) {
  return value !== null && /^(?=.*[A-Za-z])[A-Za-z0-9_-]{10,256}$/.test(value);
}

export function signalsFromUrl(params: URLSearchParams, referrer: string, host: string, path: string): Touch {
  let referrerDomain: string | undefined;
  try {
    const url = new URL(referrer);
    if (/^https?:$/.test(url.protocol) && url.hostname.replace(/^www\./, "") !== host.replace(/^www\./, "")) {
      referrerDomain = url.hostname;
    }
  } catch {
    // A missing referrer is normal.
  }
  return cleanTouch({
    source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign"),
    campaignId: params.get("utm_id"), content: params.get("utm_content"), term: params.get("utm_term"),
    google: ["gclid", "gbraid", "wbraid"].some((key) => hasOpaqueId(params.get(key))),
    meta: hasOpaqueId(params.get("fbclid")),
    openai: openAIClickReferencePattern.test(params.get("oppref") ?? ""),
    referrerDomain, landingPath: path,
  });
}

export function classifyTouch(touch: Touch): ClassifiedTouch {
  const source = touch.source ?? "";
  const medium = touch.medium ?? "";
  const domain = touch.referrerDomain ?? "";
  const signals = new Set<Channel>();
  if (touch.google || (paid.test(medium) && googleSources.has(source))) signals.add("google_ads");
  if (paid.test(medium) && metaSources.has(source)) signals.add("meta_ads");
  if (touch.openai || (paid.test(medium) && openAISources.has(source))) signals.add("openai_ads");
  let channel: Channel;
  if (signals.size > 1) channel = "unknown";
  else if (signals.size === 1) channel = [...signals][0];
  else if (paid.test(medium)) channel = "paid_other";
  else if (/^(email|e-mail|newsletter)$/.test(medium)) channel = "email";
  else if (ai.test(domain) || openAISources.has(source)) channel = "ai_referral";
  else if (search.test(domain) || (medium === "organic" && (googleSources.has(source) || ["bing", "duckduckgo"].includes(source)))) channel = "organic_search";
  else if (social.test(domain) || metaSources.has(source) || /^(social|organic[_ -]?social)$/.test(medium)) channel = "organic_social";
  else if (domain || source || medium || touch.campaign || touch.campaignId) channel = "referral";
  else channel = touch.meta ? "unknown" : "direct";
  return { ...touch, channel };
}

export function getAttribution(context: AttributionContext, now: number) {
  const inWindow = (touch?: Touch) => touch?.at !== undefined && touch.at <= now && now - touch.at <= attributionWindow;
  const first = inWindow(context.first) ? classifyTouch(context.first!) : undefined;
  const session = inWindow(context.session) ? classifyTouch(context.session!) : undefined;
  const last = inWindow(context.last) ? classifyTouch(context.last!) : undefined;
  return { first, session, conversion: (session && session.channel !== "direct" && session.channel !== "unknown" ? session : last) ?? session ?? { channel: "unknown" as const } };
}

export function isChannel(value: unknown): value is Channel {
  return typeof value === "string" && Object.hasOwn(channelLabels, value);
}
