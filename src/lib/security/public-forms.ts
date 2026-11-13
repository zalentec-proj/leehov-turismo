import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import { cleanCampaignTag, publicPath } from "@/features/conversions/attribution";
import type { AttributionInput } from "@/features/shared/attribution";
import type { Json } from "@/types/database";

export type PublicFormScope = "contact" | "caravan_interest" | "newsletter";
export type RateLimitScope = PublicFormScope | "login" | "password_recovery";

type SecurityResult =
  | { allowed: true; metadata: Record<string, Json | undefined> }
  | { allowed: false; silent: boolean; message: string };

function requireFormSecuritySecret() {
  const secret = process.env.FORM_SECURITY_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("FORM_SECURITY_SECRET is missing or too short.");
  }
  return secret;
}

export async function protectPublicForm(input: {
  scope: PublicFormScope;
  honeypot?: string;
  turnstileToken?: string;
  attribution?: AttributionInput;
}): Promise<SecurityResult> {
  if (input.honeypot?.trim()) {
    return {
      allowed: false,
      silent: true,
      message: "Recebemos seus dados. Se necessário, nossa equipe entrará em contato.",
    };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remoteIp = forwardedFor || requestHeaders.get("x-real-ip")?.trim() || "unknown";
  const withinLimit = await consumeRateLimit(input.scope, 5, 900, remoteIp);
  if (!withinLimit) {
    return {
      allowed: false,
      silent: false,
      message: "Muitas tentativas em pouco tempo. Aguarde 15 minutos e tente novamente.",
    };
  }

  const turnstile = await verifyTurnstileToken(input.turnstileToken, remoteIp);
  if (!turnstile.success) {
    return {
      allowed: false,
      silent: false,
      message: turnstile.configurationError
        ? "A proteção anti-spam está com configuração incompleta. Tente novamente mais tarde."
        : "Não foi possível validar o desafio anti-spam. Atualize a página e tente novamente.",
    };
  }

  return {
    allowed: true,
    metadata: {
      pagePath: publicPath(input.attribution?.pagePath),
      utmSource: cleanCampaignTag(input.attribution?.utmSource),
      utmMedium: cleanCampaignTag(input.attribution?.utmMedium),
      utmCampaign: cleanCampaignTag(input.attribution?.utmCampaign),
      utmContent: cleanCampaignTag(input.attribution?.utmContent),
      utmTerm: cleanCampaignTag(input.attribution?.utmTerm),
    },
  };
}

/** Applies server-side limits to forms that do not carry a Turnstile widget. */
export async function consumeRateLimit(
  scope: RateLimitScope,
  limit: number,
  windowSeconds: number,
  suppliedIp?: string,
) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remoteIp = suppliedIp || forwardedFor || requestHeaders.get("x-real-ip")?.trim() || "unknown";
  const identifierHash = createHmac("sha256", requireFormSecuritySecret())
    .update(`${scope}:${remoteIp}`)
    .digest("hex");
  const admin = createAdminClient();
  const parameters = {
    p_identifier_hash: identifierHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  };
  let { data, error } = await admin.rpc("consume_form_rate_limit", {
    ...parameters,
    p_scope: scope,
  });

  // Compatibility during the remote migration window: older databases only
  // accept public-form scope names. The HMAC still contains the real scope, so
  // login and recovery counters remain isolated and no request is allowed
  // without a database-backed limit.
  if (error && (scope === "login" || scope === "password_recovery")) {
    const fallback = await admin.rpc("consume_form_rate_limit", {
      ...parameters,
      p_scope: "contact",
    });
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;
  return Boolean(data);
}
