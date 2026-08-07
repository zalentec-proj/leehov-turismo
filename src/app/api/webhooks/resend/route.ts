import { NextResponse, type NextRequest } from "next/server";
import { updateEmailLogFromProvider } from "@/lib/email/email-log";
import { getResendClient } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailStatus } from "@/features/emails/types";
import type { Json } from "@/types/database";

const statusByEvent: Partial<Record<string, EmailStatus>> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.suppressed": "suppressed",
};

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!secret || !id || !timestamp || !signature) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.text();
  let event: ReturnType<typeof getResendClient>["webhooks"] extends { verify: (...args: never[]) => infer R } ? R : never;
  try {
    event = getResendClient().webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret: secret });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const admin = createAdminClient();
  const data = event.data as { email_id?: string; created_at?: string; failed?: { reason?: string }; bounce?: { message?: string }; suppressed?: { message?: string } };
  const { error: eventError } = await admin.from("resend_webhook_events").insert({
    event_id: id,
    event_type: event.type,
    provider_message_id: data.email_id ?? null,
    payload: JSON.parse(payload) as Json,
  });
  if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "Persistence failed" }, { status: 500 });
  const status = statusByEvent[event.type];
  if (status && data.email_id) {
    await updateEmailLogFromProvider({
      providerMessageId: data.email_id,
      status: status as Exclude<EmailStatus, "pending" | "skipped">,
      eventAt: event.created_at,
      errorMessage: data.failed?.reason || data.bounce?.message || data.suppressed?.message,
    });
  }
  return NextResponse.json({ received: true });
}
