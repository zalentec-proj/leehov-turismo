import "server-only";

import { decryptSecret, hasEncryptionKey } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";

export const GOOGLE_BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";
export const GOOGLE_TOKEN_KEY_ENV = "GOOGLE_TOKEN_ENCRYPTION_KEY";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export type GoogleConnectionRow = {
  id: string;
  refresh_token_ciphertext: string;
  scopes: string[];
  status: "pending_location" | "connected" | "disconnected" | "error";
  account_id: string | null;
  account_name: string | null;
  location_id: string | null;
  location_name: string | null;
  google_maps_url: string | null;
  connected_at: string;
  disconnected_at: string | null;
  last_token_refresh_at: string | null;
};

export function getGoogleOAuthConfiguration() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() ?? "";
  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret && redirectUri && hasEncryptionKey(GOOGLE_TOKEN_KEY_ENV)),
  };
}

export function assertGoogleBusinessProfileEnv() {
  const config = getGoogleOAuthConfiguration();
  if (!config.configured) {
    throw new Error("A integração OAuth do Google Business Profile ainda não está configurada no servidor.");
  }
  return config;
}

export function buildGoogleAuthorizationUrl(state: string) {
  const config = assertGoogleBusinessProfileEnv();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_BUSINESS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "false");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

async function parseTokenResponse(response: Response) {
  const body = await response.json() as TokenResponse;
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || "O Google recusou a solicitação OAuth.");
  }
  return body;
}

export async function exchangeGoogleAuthorizationCode(code: string) {
  const config = assertGoogleBusinessProfileEnv();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  return parseTokenResponse(response);
}

export async function getLiveGoogleConnection(): Promise<GoogleConnectionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("google_business_connections")
    .select("*")
    .neq("status", "disconnected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Não foi possível carregar a conexão do Google Business Profile.");
  return data as GoogleConnectionRow | null;
}

export async function getGoogleAccessToken(connection: GoogleConnectionRow) {
  const config = assertGoogleBusinessProfileEnv();
  const refreshToken = decryptSecret(connection.refresh_token_ciphertext, GOOGLE_TOKEN_KEY_ENV);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const token = await parseTokenResponse(response);
  await createAdminClient()
    .from("google_business_connections")
    .update({ last_token_refresh_at: new Date().toISOString(), status: connection.location_id ? "connected" : "pending_location" })
    .eq("id", connection.id);
  return token.access_token as string;
}

export async function googleBusinessFetch<T>(connection: GoogleConnectionRow, url: string, init: RequestInit = {}) {
  const accessToken = await getGoogleAccessToken(connection);
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) as T & { error?: { message?: string } } : {} as T;
  if (!response.ok) {
    const message = "error" in (body as object)
      ? (body as { error?: { message?: string } }).error?.message
      : undefined;
    throw new Error(message || `A API do Google respondeu com status ${response.status}.`);
  }
  return body as T;
}

export function normalizeGoogleResourceId(value: string, prefix: "accounts/" | "locations/") {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
