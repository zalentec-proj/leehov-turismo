import { hashMetaIdentifier, normalizeBrazilPhone, normalizeEmail } from "@/features/meta-conversions/rd-payload";

export type MetaContact = { email?: string | null; phone?: string | null; externalId?: string | null };

export type MetaPurchase = {
  eventId: string;
  eventTime: string;
  value: number;
  orderId: string;
  routeName: string;
  contact: MetaContact;
  pixelId: string;
  testEventCode?: string | null;
};

function getMetaToken() {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) throw new Error("META_CAPI_ACCESS_TOKEN não está configurado no servidor.");
  return token;
}

export function buildMetaPurchasePayload(purchase: MetaPurchase) {
  const email = normalizeEmail(purchase.contact.email);
  const phone = normalizeBrazilPhone(purchase.contact.phone);
  const externalId = String(purchase.contact.externalId ?? "").trim();
  const userData = {
    ...(email ? { em: [hashMetaIdentifier(email)] } : {}),
    ...(phone ? { ph: [hashMetaIdentifier(phone)] } : {}),
    ...(externalId ? { external_id: [hashMetaIdentifier(externalId)] } : {}),
  };
  if (!Object.keys(userData).length) throw new Error("O contato não possui e-mail, telefone ou identificador para correspondência.");

  return {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(new Date(purchase.eventTime).getTime() / 1000),
      event_id: purchase.eventId,
      action_source: "system_generated",
      user_data: userData,
      custom_data: {
        value: purchase.value,
        currency: "BRL",
        order_id: purchase.orderId,
        content_name: purchase.routeName,
      },
    }],
    ...(purchase.testEventCode ? { test_event_code: purchase.testEventCode } : {}),
  };
}

export async function sendMetaPurchase(purchase: MetaPurchase) {
  const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(purchase.pixelId)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...buildMetaPurchasePayload(purchase), access_token: getMetaToken() }),
    cache: "no-store",
  });
  const body = await response.text();
  if (!response.ok) throw Object.assign(new Error(`Meta rejeitou a conversão (HTTP ${response.status}).`), { status: response.status, body: body.slice(0, 500) });
  return { status: response.status, body: body.slice(0, 500) };
}
