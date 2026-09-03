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
const TOKEN_URL = "https://api.rd.services/auth/token";

type StoredTokens = { accessToken: string | null; refreshToken: string; expiresAt: string | null };

function hasOauthConfiguration() {
  return Boolean(
    process.env.RD_CRM_CLIENT_ID
    && process.env.RD_CRM_CLIENT_SECRET
    && process.env.RD_CRM_REFRESH_TOKEN
    && hasEncryptionKey(ENCRYPTION_KEY),
  );
}

export function hasRdCredentials() {
  return hasOauthConfiguration() || Boolean(process.env.RD_CRM_API_TOKEN);
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
  if (!hasOauthConfiguration()) {
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

async function getRd(path: string, retried = false) {
  const response = await fetch(`${apiBase()}${path}`, { headers: { Authorization: `Bearer ${await accessToken(retried)}`, Accept: "application/json" }, cache: "no-store" });
  if (response.status === 401 && hasOauthConfiguration() && !retried) return getRd(path, true);
  if (!response.ok) throw new Error(`RD não respondeu ao buscar o cadastro (HTTP ${response.status}).`);
  return response.json() as Promise<unknown>;
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
