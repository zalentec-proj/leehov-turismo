import { normalizeBrazilPhone, normalizeEmail } from "@/features/meta-conversions/rd-payload";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret, hasEncryptionKey } from "@/lib/security/encryption";

type UnknownRecord = Record<string, unknown>;

function object(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function pickText(value: unknown, keys: string[]) {
  const item = object(value);
  for (const key of keys) {
    const candidate = item[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

function apiBase() {
  return (process.env.RD_CRM_API_BASE_URL || "https://api.rd.services/crm/v2").replace(/\/$/, "");
}

const ENCRYPTION_KEY = "WEBHOOK_SECRET_ENCRYPTION_KEY";
// Official RD Station CRM OAuth endpoint for authorization-code exchange and refresh.
const TOKEN_URL = "https://api.rd.services/oauth2/token";
const WEBHOOKS_URL = "https://api.rd.services/integrations/webhooks";

type StoredTokens = { accessToken: string | null; refreshToken: string; expiresAt: string | null };

export class RdOauthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RdOauthError";
  }
}

export function getRdOauthCallbackUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL não está configurada para o OAuth do RD.");
  return new URL("/api/integrations/rd/oauth/callback", siteUrl).toString();
}

export function hasRdOauthClientConfiguration() {
  return Boolean(
    process.env.RD_CRM_CLIENT_ID
    && process.env.RD_CRM_CLIENT_SECRET
    && hasEncryptionKey(ENCRYPTION_KEY),
  );
}

export function hasRdCredentials() {
  return hasRdOauthClientConfiguration() || Boolean(process.env.RD_CRM_API_TOKEN);
}

function tokenIsUsable(expiresAt: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now() + 60_000);
}

async function readStoredTokens(): Promise<StoredTokens | null> {
  const { data, error } = await createAdminClient().from("meta_conversion_rd_oauth_tokens").select("encrypted_access_token, encrypted_refresh_token, access_token_expires_at").eq("id", true).maybeSingle();
  if (error || !data) return null;
  try {
    return {
      accessToken: data.encrypted_access_token ? decryptSecret(data.encrypted_access_token, ENCRYPTION_KEY) : null,
      refreshToken: decryptSecret(data.encrypted_refresh_token, ENCRYPTION_KEY),
      expiresAt: data.access_token_expires_at,
    };
  } catch {
    throw new Error("Não foi possível ler com segurança a credencial OAuth do RD.");
  }
}

async function saveTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const expiresAt = new Date(Date.now() + Math.max(0, expiresIn) * 1000).toISOString();
  const { error } = await createAdminClient().from("meta_conversion_rd_oauth_tokens").upsert({
    id: true,
    encrypted_access_token: encryptSecret(accessToken, ENCRYPTION_KEY),
    encrypted_refresh_token: encryptSecret(refreshToken, ENCRYPTION_KEY),
    access_token_expires_at: expiresAt,
  });
  if (error) throw new Error("Não foi possível armazenar com segurança a renovação OAuth do RD.");
  return { accessToken, expiresAt };
}

export async function exchangeRdAuthorizationCode(code: string) {
  if (!hasRdOauthClientConfiguration()) {
    throw new Error("Configure RD_CRM_CLIENT_ID, RD_CRM_CLIENT_SECRET e WEBHOOK_SECRET_ENCRYPTION_KEY antes de autorizar o RD.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.RD_CRM_CLIENT_ID ?? "",
      client_secret: process.env.RD_CRM_CLIENT_SECRET ?? "",
      code,
      redirect_uri: getRdOauthCallbackUrl(),
    }),
    cache: "no-store",
  });
  const payload = object(await response.json().catch(() => null));
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  const refreshToken = typeof payload.refresh_token === "string" ? payload.refresh_token : "";
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : Number(payload.expires_in);
  if (!response.ok || !accessToken || !refreshToken || !Number.isFinite(expiresIn)) {
    throw new RdOauthError(`rd_oauth_token_exchange_failed_http_${response.status}`);
  }
  try {
    await saveTokens(accessToken, refreshToken, expiresIn);
  } catch {
    throw new RdOauthError("rd_oauth_token_storage_failed");
  }
}

async function refreshOauthToken(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.RD_CRM_CLIENT_ID ?? "",
      client_secret: process.env.RD_CRM_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });
  const payload = object(await response.json().catch(() => null));
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  const rotatedRefreshToken = typeof payload.refresh_token === "string" ? payload.refresh_token : "";
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : Number(payload.expires_in);
  if (!response.ok || !accessToken || !rotatedRefreshToken || !Number.isFinite(expiresIn)) {
    throw new Error("Não foi possível renovar a autorização OAuth do RD.");
  }
  return saveTokens(accessToken, rotatedRefreshToken, expiresIn);
}

async function accessToken(forceRefresh = false) {
  if (!hasRdOauthClientConfiguration()) {
    const fallback = process.env.RD_CRM_API_TOKEN;
    if (!fallback) throw new Error("A credencial do RD não está configurada no servidor.");
    return fallback;
  }
  const stored = await readStoredTokens();
  if (!forceRefresh && stored?.accessToken && tokenIsUsable(stored.expiresAt)) return stored.accessToken;
  const refreshToken = stored?.refreshToken ?? process.env.RD_CRM_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("A renovação OAuth do RD não está configurada no servidor.");
  return (await refreshOauthToken(refreshToken)).accessToken;
}

async function authenticatedRdRequest(url: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await accessToken(retried)}`);
  headers.set("Accept", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (response.status === 401 && hasRdOauthClientConfiguration() && !retried) return authenticatedRdRequest(url, init, true);
  return response;
}

async function getRd(path: string) {
  const response = await authenticatedRdRequest(`${apiBase()}${path}`);
  if (!response.ok) throw new Error(`RD não respondeu ao buscar o cadastro (HTTP ${response.status}).`);
  return response.json() as Promise<unknown>;
}

function webhookList(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.map(object);
  const item = object(payload);
  for (const key of ["webhooks", "subscriptions", "data"]) {
    if (Array.isArray(item[key])) return item[key].map(object);
  }
  return [];
}

function metaPurchaseWebhookUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL não está configurada para o webhook do RD.");
  return new URL("/api/integrations/rd/meta-purchase", siteUrl).toString();
}

export async function configureRdMetaPurchaseWebhook() {
  const secret = process.env.RD_META_WEBHOOK_SECRET;
  if (!secret) throw new Error("RD_META_WEBHOOK_SECRET não está configurado no servidor.");

  const callbackUrl = metaPurchaseWebhookUrl();
  const listResponse = await authenticatedRdRequest(WEBHOOKS_URL);
  if (!listResponse.ok) throw new Error(`RD não respondeu ao listar webhooks (HTTP ${listResponse.status}).`);
  const existing = webhookList(await listResponse.json().catch(() => null));
  if (existing.some((webhook) => pickText(webhook, ["event_type"]) === "crm_deal_updated" && pickText(webhook, ["url"]) === callbackUrl)) {
    return { created: false };
  }

  const createResponse = await authenticatedRdRequest(WEBHOOKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "crm_deal_updated",
      entity_type: "CONTACT",
      url: callbackUrl,
      http_method: "POST",
      auth_header: "x-leehov-rd-webhook-key",
      auth_key: secret,
    }),
  });
  if (!createResponse.ok) throw new Error(`RD não aceitou o webhook (HTTP ${createResponse.status}).`);
  return { created: true };
}

export async function fetchRdContact(contactId: string) {
  const payload = object(await getRd(`/contacts/${encodeURIComponent(contactId)}`));
  const contact = object(payload.contact ?? payload);
  const emails = Array.isArray(contact.emails) ? contact.emails : [];
  const phones = Array.isArray(contact.phones) ? contact.phones : [];
  const firstEmail = typeof emails[0] === "string" ? emails[0] : pickText(emails[0], ["email", "value"]);
  const firstPhone = typeof phones[0] === "string" ? phones[0] : pickText(phones[0], ["phone", "value"]);
  return {
    email: normalizeEmail(pickText(contact, ["email", "email_address"]) || firstEmail),
    phone: normalizeBrazilPhone(pickText(contact, ["phone", "mobile_phone", "whatsapp"]) || firstPhone),
    externalId: pickText(contact, ["id", "uuid", "external_id"]) || contactId,
  };
}

export async function fetchRdDeal(dealId: string) {
  return getRd(`/deals/${encodeURIComponent(dealId)}`);
}
