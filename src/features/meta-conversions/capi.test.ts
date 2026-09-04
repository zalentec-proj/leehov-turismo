import { describe, expect, it } from "vitest";
import { buildMetaPurchasePayload } from "@/features/meta-conversions/capi";

describe("payload de Purchase para a Meta", () => {
  it("envia somente identificadores de contato com hash e dados da compra", () => {
    const payload = buildMetaPurchasePayload({ eventId: "rd_purchase_1", eventTime: "2026-09-02T12:00:00Z", value: 25000, orderId: "deal-1", routeName: "China e Singapura", pixelId: "pixel", contact: { email: "Cliente@Exemplo.com", phone: "11998765432", externalId: "contact-1", firstName: "Maria", lastName: "da Silva" } });
    const event = payload.data[0];
    expect(event.user_data.em?.[0]).toHaveLength(64);
    expect(event.user_data.ph?.[0]).toHaveLength(64);
    expect(event.user_data.fn?.[0]).toHaveLength(64);
    expect(event.user_data.ln?.[0]).toHaveLength(64);
    expect(JSON.stringify(payload)).not.toContain("Cliente@Exemplo.com");
    expect(JSON.stringify(payload)).not.toContain("Maria");
    expect(event.custom_data).toMatchObject({ currency: "BRL", value: 25000, order_id: "deal-1" });
  });

  it("recusa contato sem e-mail, telefone ou id externo", () => {
    expect(() => buildMetaPurchasePayload({ eventId: "1", eventTime: "2026-09-02T12:00:00Z", value: 1, orderId: "1", routeName: "Teste", pixelId: "pixel", contact: {} })).toThrow("não possui e-mail");
  });
});
