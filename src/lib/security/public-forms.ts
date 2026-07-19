import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
import type { AttributionInput } from "@/features/shared/attribution";
import type { Json } from "@/types/database";

export type PublicFormScope = "contact" | "caravan_interest" | "newsletter";

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

function cleanReferrer(value: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return undefined;
  }
}

function cleanPath(value?: string) {
  if (!value?.startsWith("/")) return undefined;
  return value.split("?")[0]?.slice(0, 500);
}

function cleanUtm(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 100) : undefined;
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
  const identifierHash = createHmac("sha256", requireFormSecuritySecret())
    .update(`${input.scope}:${remoteIp}`)
    .digest("hex");

  const admin = createAdminClient();
  const { data: withinLimit, error: rateError } = await admin.rpc("consume_form_rate_limit", {
    p_scope: input.scope,
    p_identifier_hash: identifierHash,
    p_limit: 5,
    p_window_seconds: 900,
  });

  if (rateError) throw rateError;
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
      pagePath: cleanPath(input.attribution?.pagePath),
      referrer: cleanReferrer(requestHeaders.get("referer")),
      utmSource: cleanUtm(input.attribution?.utmSource),
      utmMedium: cleanUtm(input.attribution?.utmMedium),
      utmCampaign: cleanUtm(input.attribution?.utmCampaign),
      utmContent: cleanUtm(input.attribution?.utmContent),
      utmTerm: cleanUtm(input.attribution?.utmTerm),
    },
  };
}
