"use server";

import { createHash, randomBytes } from "node:crypto";
import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { NewsletterDoubleOptInEmail } from "@/emails/templates/newsletter-double-opt-in-email";
import { NewsletterWelcomeEmail } from "@/emails/templates/newsletter-welcome-email";
import { newsletterSignupSchema, newsletterTokenSchema, type NewsletterSignupInput } from "@/features/newsletter/schema";
import type { NewsletterActionResult } from "@/features/newsletter/types";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { protectPublicForm } from "@/lib/security/public-forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitWebhookEvent } from "@/lib/webhooks/events";

const genericSubscriptionMessage = "Se este e-mail puder ser inscrito, enviaremos as próximas instruções.";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function revalidateNewsletter() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath("/admin/newsletter");
}

export async function subscribeNewsletterAction(rawInput: NewsletterSignupInput): Promise<NewsletterActionResult> {
  const parsed = newsletterSignupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revise os dados informados." };
  }

  try {
    const input = parsed.data;
    const security = await protectPublicForm({
      scope: "newsletter",
      honeypot: input.company,
      turnstileToken: input.turnstileToken,
      attribution: input,
    });
    if (!security.allowed) {
      return { success: security.silent, message: security.silent ? genericSubscriptionMessage : security.message };
    }

    const admin = createAdminClient();
    const normalizedEmail = input.email.toLocaleLowerCase("pt-BR");
    const { data: existing, error: loadError } = await admin
      .from("newsletter_subscribers")
      .select("id, status, confirmation_sent_at")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (loadError) throw loadError;

    if (existing?.status === "active") {
      return { success: true, message: genericSubscriptionMessage };
    }

    const cooldownStartedAt = existing?.confirmation_sent_at ? new Date(existing.confirmation_sent_at).getTime() : 0;
    if (existing?.status === "pending" && Date.now() - cooldownStartedAt < 15 * 60 * 1000) {
      return { success: true, message: genericSubscriptionMessage };
    }

    const token = createToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const payload = {
      name: input.name || null,
      email: normalizedEmail,
      source: input.source,
      status: "pending" as const,
      confirmation_token_hash: hashToken(token),
      confirmation_expires_at: expiresAt.toISOString(),
      confirmation_sent_at: now.toISOString(),
      confirmed_at: null,
      unsubscribe_token_hash: null,
      unsubscribed_at: null,
      metadata: security.metadata,
    };
    const { data: subscriber, error: saveError } = await admin
      .from("newsletter_subscribers")
      .upsert(payload, { onConflict: "email" })
      .select("id")
      .single();
    if (saveError) throw saveError;

    await emitWebhookEvent("newsletter.subscribed", { subscriberId: subscriber.id, source: input.source });

    const confirmationUrl = `${siteUrl()}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
    await Promise.allSettled([
      sendTransactionalEmail({
        templateKey: "newsletter_double_opt_in",
        to: normalizedEmail,
        subject: "Confirme sua inscrição na Leehov Turismo",
        react: createElement(NewsletterDoubleOptInEmail, { name: input.name || undefined, confirmationUrl }),
        relatedEntityType: "newsletter_subscriber",
        relatedEntityId: subscriber.id,
      }),
    ]);

    revalidateNewsletter();
    return { success: true, message: genericSubscriptionMessage };
  } catch {
    return { success: false, message: "Não foi possível concluir a inscrição agora. Tente novamente em alguns instantes." };
  }
}

export async function confirmNewsletterAction(rawToken: string): Promise<NewsletterActionResult> {
  const parsed = newsletterTokenSchema.safeParse(rawToken);
  if (!parsed.success) return { success: false, status: "invalid", message: "Link de confirmação inválido." };

  try {
    const tokenHash = hashToken(parsed.data);
    const admin = createAdminClient();
    const { data: pending, error } = await admin
      .from("newsletter_subscribers")
      .select("id, name, email, confirmation_expires_at")
      .eq("confirmation_token_hash", tokenHash)
      .eq("status", "pending")
      .maybeSingle();
    if (error) throw error;
    if (!pending) return { success: false, status: "invalid", message: "Link de confirmação inválido." };
    if (!pending.confirmation_expires_at || new Date(pending.confirmation_expires_at).getTime() <= Date.now()) {
      return { success: false, status: "expired", message: "Este link expirou. Faça uma nova inscrição para receber outro." };
    }

    const unsubscribeToken = createToken();
    const confirmedAt = new Date().toISOString();
    const { data: confirmed, error: updateError } = await admin
      .from("newsletter_subscribers")
      .update({
        status: "active",
        confirmation_token_hash: null,
        confirmation_expires_at: null,
        confirmed_at: confirmedAt,
        unsubscribe_token_hash: hashToken(unsubscribeToken),
        unsubscribed_at: null,
      })
      .eq("id", pending.id)
      .eq("status", "pending")
      .eq("confirmation_token_hash", tokenHash)
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!confirmed) return { success: false, status: "invalid", message: "Este link já foi utilizado ou não é mais válido." };

    await emitWebhookEvent("newsletter.confirmed", { subscriberId: pending.id });

    const unsubscribeUrl = `${siteUrl()}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    await Promise.allSettled([
      sendTransactionalEmail({
        templateKey: "newsletter_welcome",
        to: pending.email,
        subject: "Você está na lista da Leehov Turismo",
        react: createElement(NewsletterWelcomeEmail, {
          name: pending.name || "viajante",
          caravansUrl: `${siteUrl()}/caravanas`,
          unsubscribeUrl,
        }),
        relatedEntityType: "newsletter_subscriber",
        relatedEntityId: pending.id,
      }),
    ]);

    revalidateNewsletter();
    return { success: true, status: "confirmed", message: "Inscrição confirmada. Boas-vindas à lista da Leehov!" };
  } catch {
    return { success: false, status: "invalid", message: "Não foi possível confirmar a inscrição." };
  }
}

export async function unsubscribeNewsletterAction(rawToken: string): Promise<NewsletterActionResult> {
  const parsed = newsletterTokenSchema.safeParse(rawToken);
  if (!parsed.success) return { success: false, status: "invalid", message: "Link de cancelamento inválido." };

  try {
    const tokenHash = hashToken(parsed.data);
    const admin = createAdminClient();
    const { data: subscriber, error } = await admin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("unsubscribe_token_hash", tokenHash)
      .maybeSingle();
    if (error) throw error;
    if (!subscriber) return { success: false, status: "invalid", message: "Link de cancelamento inválido." };

    if (subscriber.status === "active") {
      const { error: updateError } = await admin
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("id", subscriber.id)
        .eq("status", "active");
      if (updateError) throw updateError;
    }

    revalidateNewsletter();
    return { success: true, status: "unsubscribed", message: "Sua inscrição foi cancelada." };
  } catch {
    return { success: false, status: "invalid", message: "Não foi possível cancelar a inscrição." };
  }
}
